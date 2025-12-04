/**
 * Cleanup Inactive Accounts Job
 * 
 * Automatically deletes user accounts that have been inactive for 15 days.
 * This runs as a scheduled job (cron) or can be triggered manually.
 * 
 * GDPR Compliance: Users are notified about this policy in the UI.
 */

const User = require('../models/User');
const Project = require('../models/Project');
const ApiResponse = require('../models/ApiResponse');
const Tunnel = require('../models/Tunnel');
const logger = require('../utils/logger');

const INACTIVE_DAYS = 15;

/**
 * Delete all data associated with a user
 */
async function deleteUserData(userId) {
  // Delete tunnels
  const tunnelResult = await Tunnel.deleteMany({ userId });
  
  // Get projects and delete responses
  const projects = await Project.find({ userId }).select('_id');
  const projectIds = projects.map(p => p._id);
  const responseResult = await ApiResponse.deleteMany({ projectId: { $in: projectIds } });
  
  // Delete projects
  const projectResult = await Project.deleteMany({ userId });
  
  // Delete user
  await User.findByIdAndDelete(userId);
  
  return {
    tunnels: tunnelResult.deletedCount,
    responses: responseResult.deletedCount,
    projects: projectResult.deletedCount
  };
}

/**
 * Main cleanup function
 */
async function cleanupInactiveAccounts() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - INACTIVE_DAYS);
  
  logger.info('Starting inactive account cleanup', { 
    cutoffDate: cutoffDate.toISOString(),
    inactiveDays: INACTIVE_DAYS 
  });
  
  try {
    // Find users who haven't logged in for INACTIVE_DAYS
    // Also include users who have never logged in and were created before cutoff
    const inactiveUsers = await User.find({
      $or: [
        { lastLogin: { $lt: cutoffDate } },
        { lastLogin: null, createdAt: { $lt: cutoffDate } }
      ]
    }).select('_id email lastLogin createdAt');
    
    logger.info(`Found ${inactiveUsers.length} inactive accounts to clean up`);
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const user of inactiveUsers) {
      try {
        const result = await deleteUserData(user._id);
        deletedCount++;
        
        logger.info('Deleted inactive account', {
          userId: user._id,
          email: user.email.substring(0, 3) + '***',
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          deletedData: result
        });
      } catch (err) {
        errorCount++;
        logger.error('Failed to delete inactive account', {
          userId: user._id,
          error: err.message
        });
      }
    }
    
    logger.info('Inactive account cleanup completed', {
      totalFound: inactiveUsers.length,
      deleted: deletedCount,
      errors: errorCount
    });
    
    return {
      found: inactiveUsers.length,
      deleted: deletedCount,
      errors: errorCount
    };
  } catch (err) {
    logger.error('Inactive account cleanup failed', { error: err.message });
    throw err;
  }
}

module.exports = {
  cleanupInactiveAccounts,
  deleteUserData,
  INACTIVE_DAYS
};
