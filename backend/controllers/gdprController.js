/**
 * GDPR Controller
 * 
 * Implements GDPR compliance features:
 * - Article 15: Right of access
 * - Article 17: Right to erasure
 * - Article 20: Right to data portability
 */

const User = require('../models/User');
const Project = require('../models/Project');
const ApiResponse = require('../models/ApiResponse');
const Tunnel = require('../models/Tunnel');
const logger = require('../utils/logger');

/**
 * Export all user data (GDPR Article 15 & 20)
 * Returns all data associated with the user in JSON format
 */
exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Audit log
    logger.info('GDPR data export requested', { userId });

    // Fetch user data (excluding password)
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Fetch all user's projects
    const projects = await Project.find({ userId });

    // Fetch all responses for user's projects
    const projectIds = projects.map(p => p._id);
    const responses = await ApiResponse.find({ projectId: { $in: projectIds } });

    // Fetch all user's tunnels
    const tunnels = await Tunnel.find({ userId }).select('-authentication.password -authentication.token');

    // Compile export data
    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      gdprCompliance: {
        article15: 'Right of access',
        article20: 'Right to data portability'
      },
      userData: {
        profile: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          provider: user.provider,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt
        },
        projects: projects.map(p => ({
          id: p._id,
          name: p.name,
          description: p.description,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        })),
        responses: responses.map(r => ({
          id: r._id,
          projectId: r.projectId,
          method: r.method,
          url: r.url,
          statusCode: r.statusCode,
          headers: r.headers,
          body: r.body,
          createdAt: r.createdAt
        })),
        tunnels: tunnels.map(t => ({
          id: t._id,
          subdomain: t.subdomain,
          publicUrl: t.publicUrl,
          localPort: t.localPort,
          status: t.status,
          createdAt: t.createdAt
        }))
      },
      dataCategories: [
        { category: 'Identity', description: 'Email, name, avatar' },
        { category: 'Authentication', description: 'Login provider, verification status' },
        { category: 'Projects', description: 'API projects created by user' },
        { category: 'Responses', description: 'API responses stored in projects' },
        { category: 'Tunnels', description: 'Tunnel configurations' }
      ]
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="gdpr-export-${userId}-${Date.now()}.json"`);
    
    res.json(exportData);

    logger.info('GDPR data export completed', { userId });
  } catch (err) {
    logger.error('GDPR export error', { error: err.message, userId: req.user?.id });
    res.status(500).json({ msg: 'Error exporting data' });
  }
};

/**
 * Delete user account and all associated data (GDPR Article 17)
 * This is irreversible
 */
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmation } = req.body;

    // Require explicit confirmation
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({ 
        msg: 'Please confirm deletion by sending { "confirmation": "DELETE_MY_ACCOUNT" }' 
      });
    }

    // Audit log before deletion
    logger.info('GDPR account deletion requested', { userId });

    // Fetch user to verify existence
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Delete all user's tunnels
    const tunnelResult = await Tunnel.deleteMany({ userId });
    logger.info('Deleted user tunnels', { userId, count: tunnelResult.deletedCount });

    // Fetch user's projects
    const projects = await Project.find({ userId });
    const projectIds = projects.map(p => p._id);

    // Delete all responses for user's projects
    const responseResult = await ApiResponse.deleteMany({ projectId: { $in: projectIds } });
    logger.info('Deleted user responses', { userId, count: responseResult.deletedCount });

    // Delete all user's projects
    const projectResult = await Project.deleteMany({ userId });
    logger.info('Deleted user projects', { userId, count: projectResult.deletedCount });

    // Delete user account
    await User.findByIdAndDelete(userId);
    logger.info('GDPR account deletion completed', { 
      userId,
      deletedProjects: projectResult.deletedCount,
      deletedResponses: responseResult.deletedCount,
      deletedTunnels: tunnelResult.deletedCount
    });

    res.json({ 
      msg: 'Account and all associated data have been permanently deleted',
      deletedData: {
        projects: projectResult.deletedCount,
        responses: responseResult.deletedCount,
        tunnels: tunnelResult.deletedCount
      }
    });
  } catch (err) {
    logger.error('GDPR deletion error', { error: err.message, userId: req.user?.id });
    res.status(500).json({ msg: 'Error deleting account' });
  }
};

/**
 * Get list of data categories stored (GDPR Article 15)
 */
exports.getDataCategories = async (req, res) => {
  try {
    const userId = req.user.id;

    // Count user's data
    const projectCount = await Project.countDocuments({ userId });
    const projects = await Project.find({ userId }).select('_id');
    const projectIds = projects.map(p => p._id);
    const responseCount = await ApiResponse.countDocuments({ projectId: { $in: projectIds } });
    const tunnelCount = await Tunnel.countDocuments({ userId });

    res.json({
      dataCategories: [
        {
          category: 'Identity Data',
          description: 'Your email address, name, and profile picture',
          legalBasis: 'Contract performance',
          retentionPeriod: 'Until account deletion'
        },
        {
          category: 'Authentication Data',
          description: 'Login credentials (hashed), OAuth provider information',
          legalBasis: 'Contract performance',
          retentionPeriod: 'Until account deletion'
        },
        {
          category: 'Project Data',
          description: 'API projects you have created',
          count: projectCount,
          legalBasis: 'Contract performance',
          retentionPeriod: 'Until project or account deletion'
        },
        {
          category: 'Response Data',
          description: 'API responses stored in your projects',
          count: responseCount,
          legalBasis: 'Contract performance',
          retentionPeriod: 'Until response or account deletion'
        },
        {
          category: 'Tunnel Data',
          description: 'Tunnel configurations and usage statistics',
          count: tunnelCount,
          legalBasis: 'Contract performance',
          retentionPeriod: 'Until tunnel or account deletion'
        },
        {
          category: 'Log Data',
          description: 'Server logs for security and debugging',
          legalBasis: 'Legitimate interest (security)',
          retentionPeriod: '30 days'
        }
      ],
      yourRights: {
        access: 'GET /api/gdpr/export - Download all your data',
        erasure: 'DELETE /api/gdpr/delete-account - Delete your account and all data',
        portability: 'GET /api/gdpr/export - Export data in machine-readable JSON format',
        rectification: 'Contact support to correct inaccurate data',
        restriction: 'Contact support to restrict processing',
        objection: 'Contact support to object to processing'
      },
      dataController: {
        name: 'API Response Manager',
        contact: 'vijaypurohit322@gmail.com'
      }
    });
  } catch (err) {
    logger.error('GDPR data categories error', { error: err.message, userId: req.user?.id });
    res.status(500).json({ msg: 'Error fetching data categories' });
  }
};
