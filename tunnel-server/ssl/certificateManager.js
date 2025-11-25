const forge = require('node-forge');
const fs = require('fs').promises;
const path = require('path');

class CertificateManager {
  constructor() {
    this.certificates = new Map();
    this.certDir = path.join(__dirname, '../../certs');
  }

  async initialize() {
    try {
      await fs.mkdir(this.certDir, { recursive: true });
    } catch (error) {
      console.error('Error creating cert directory:', error);
    }
  }

  // Generate self-signed certificate for a domain
  async generateSelfSignedCert(domain) {
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();

    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01' + Math.floor(Math.random() * 100000);
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    const attrs = [{
      name: 'commonName',
      value: domain
    }, {
      name: 'countryName',
      value: 'US'
    }, {
      shortName: 'ST',
      value: 'California'
    }, {
      name: 'localityName',
      value: 'San Francisco'
    }, {
      name: 'organizationName',
      value: 'API Response Manager'
    }, {
      shortName: 'OU',
      value: 'Tunnel Service'
    }];

    cert.setSubject(attrs);
    cert.setIssuer(attrs);

    cert.setExtensions([{
      name: 'basicConstraints',
      cA: true
    }, {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    }, {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true
    }, {
      name: 'nsCertType',
      client: true,
      server: true,
      email: true,
      objsign: true,
      sslCA: true,
      emailCA: true,
      objCA: true
    }, {
      name: 'subjectAltName',
      altNames: [{
        type: 2, // DNS
        value: domain
      }, {
        type: 2,
        value: `*.${domain}`
      }]
    }]);

    cert.sign(keys.privateKey, forge.md.sha256.create());

    const pemCert = forge.pki.certificateToPem(cert);
    const pemKey = forge.pki.privateKeyToPem(keys.privateKey);

    // Save to disk
    const certPath = path.join(this.certDir, `${domain}.crt`);
    const keyPath = path.join(this.certDir, `${domain}.key`);

    await fs.writeFile(certPath, pemCert);
    await fs.writeFile(keyPath, pemKey);

    const certData = {
      cert: pemCert,
      key: pemKey,
      domain,
      createdAt: new Date(),
      expiresAt: cert.validity.notAfter
    };

    this.certificates.set(domain, certData);

    return certData;
  }

  // Load existing certificate
  async loadCertificate(domain) {
    const certPath = path.join(this.certDir, `${domain}.crt`);
    const keyPath = path.join(this.certDir, `${domain}.key`);

    try {
      const cert = await fs.readFile(certPath, 'utf8');
      const key = await fs.readFile(keyPath, 'utf8');

      const certData = {
        cert,
        key,
        domain,
        loadedAt: new Date()
      };

      this.certificates.set(domain, certData);
      return certData;
    } catch (error) {
      return null;
    }
  }

  // Get or generate certificate
  async getCertificate(domain) {
    // Check cache
    if (this.certificates.has(domain)) {
      return this.certificates.get(domain);
    }

    // Try to load from disk
    const loaded = await this.loadCertificate(domain);
    if (loaded) {
      return loaded;
    }

    // Generate new certificate
    return await this.generateSelfSignedCert(domain);
  }

  // Validate custom certificate
  validateCertificate(certPem, keyPem) {
    try {
      const cert = forge.pki.certificateFromPem(certPem);
      const key = forge.pki.privateKeyFromPem(keyPem);

      // Verify the key matches the certificate
      const publicKey = cert.publicKey;
      const testData = 'test';
      const md = forge.md.sha256.create();
      md.update(testData, 'utf8');
      
      const signature = key.sign(md);
      const verified = publicKey.verify(md.digest().bytes(), signature);

      if (!verified) {
        return { valid: false, error: 'Private key does not match certificate' };
      }

      // Check expiration
      const now = new Date();
      if (cert.validity.notAfter < now) {
        return { valid: false, error: 'Certificate has expired' };
      }

      if (cert.validity.notBefore > now) {
        return { valid: false, error: 'Certificate is not yet valid' };
      }

      return {
        valid: true,
        subject: cert.subject.attributes.find(a => a.name === 'commonName')?.value,
        issuer: cert.issuer.attributes.find(a => a.name === 'commonName')?.value,
        validFrom: cert.validity.notBefore,
        validTo: cert.validity.notAfter
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Store custom certificate
  async storeCustomCertificate(domain, certPem, keyPem, caPem = null) {
    const validation = this.validateCertificate(certPem, keyPem);
    
    if (!validation.valid) {
      throw new Error(`Invalid certificate: ${validation.error}`);
    }

    const certPath = path.join(this.certDir, `${domain}.crt`);
    const keyPath = path.join(this.certDir, `${domain}.key`);
    const caPath = path.join(this.certDir, `${domain}-ca.crt`);

    await fs.writeFile(certPath, certPem);
    await fs.writeFile(keyPath, keyPem);
    
    if (caPem) {
      await fs.writeFile(caPath, caPem);
    }

    const certData = {
      cert: certPem,
      key: keyPem,
      ca: caPem,
      domain,
      custom: true,
      validation,
      storedAt: new Date()
    };

    this.certificates.set(domain, certData);
    return certData;
  }

  // Remove certificate
  async removeCertificate(domain) {
    const certPath = path.join(this.certDir, `${domain}.crt`);
    const keyPath = path.join(this.certDir, `${domain}.key`);
    const caPath = path.join(this.certDir, `${domain}-ca.crt`);

    try {
      await fs.unlink(certPath);
      await fs.unlink(keyPath);
      try {
        await fs.unlink(caPath);
      } catch (e) {
        // CA file might not exist
      }
    } catch (error) {
      console.error('Error removing certificate files:', error);
    }

    this.certificates.delete(domain);
  }

  // List all certificates
  listCertificates() {
    return Array.from(this.certificates.values());
  }
}

module.exports = new CertificateManager();
