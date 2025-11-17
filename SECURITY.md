# Security Policy

## Overview

Easy Risk Register is a privacy-focused risk management application that prioritizes security and data protection. As a client-side application, all data is stored locally in the user's browser with no server transmission by default, providing inherent security benefits.

## Security Measures

### Content Security Policy (CSP)

The application implements a Content Security Policy to prevent XSS (Cross-Site Scripting) and other code injection attacks. The CSP directives include:
- `default-src 'self'` - Restricts all resources to same-origin by default
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` - Allows scripts from same origin (needed for React/Vite)
- `style-src 'self' 'unsafe-inline'` - Allows stylesheets from same-origin and inline styles
- `img-src 'self' data: https:` - Allows images from same origin, data URLs, and HTTPS sources
- `frame-ancestors 'none'` - Prevents clickjacking by blocking framing of the page

### Input Sanitization

The application implements comprehensive input sanitization to prevent XSS attacks:
- All user inputs are sanitized using the `isomorphic-dompurify` library
- Dangerous HTML tags like `<script>`, `<iframe>`, `<object>` are removed
- Potentially harmful attributes are stripped
- Only safe HTML elements are allowed (e.g., `<p>`, `<strong>`, `<em>`, lists, headings)

### Data Encryption

All risk data stored in browser local storage is encrypted:
- Uses AES-GCM encryption with 256-bit keys via the Web Crypto API
- Each encryption operation uses a randomly generated initialization vector
- Encryption occurs before data is saved to localStorage
- Encryption key is stored separately with additional protection

### CSV Import Security

The CSV import functionality includes security measures:
- Uses the `papaparse` library for secure CSV parsing instead of regex-based splitting
- Validates against CSV injection patterns that start with `=`, `+`, `-`, or `@`
- All imported data is processed through the same sanitization as manual entries

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Yes (Current)   |

## Reporting a Vulnerability

We take security seriously and appreciate your efforts to responsibly disclose any security vulnerabilities found in Easy Risk Register.

### How to Report a Security Issue

If you discover a security vulnerability, please report it to us by:

1. **Contact Method**: Send an email to [security@easy-risk-register.org](mailto:security@easy-risk-register.org)
   *(Note: This is currently a placeholder. In a production environment, this would be a real, monitored security email address. For now, please open an issue in the GitHub repository or contact the maintainers directly through other available channels)*
2. Providing a detailed description of the vulnerability
3. Including steps to reproduce the issue
4. Sharing proof-of-concept code if applicable

### What to Expect

- **Acknowledgment**: You will receive an acknowledgment within 48 hours
- **Status Updates**: We will provide regular updates on the status of your report
- **Resolution**: We aim to address critical vulnerabilities within 30 days
- **Public Disclosure**: We will coordinate with you on public disclosure timing after resolution

### Scope

We welcome reports concerning:
- Code injection vulnerabilities (XSS, SQL injection, etc.)
- Authentication/authorization issues
- Cryptographic implementation flaws
- Data exposure concerns
- Any other security-related issues

### Bug Bounty

While we do not currently offer monetary rewards, we are grateful for responsible disclosure of security vulnerabilities and will publicly acknowledge your contribution (if you wish) in our release notes after the issue is resolved.

## Security Best Practices for Users

### Data Protection
- Use strong, unique passwords for any accounts associated with your risk register
- Regularly backup your risk data to prevent loss
- Be cautious about sharing exported CSV files containing sensitive risk information

### Browser Security
- Keep your browser updated to the latest version
- Use browsers that support modern security features
- Clear browser data periodically if sharing devices
- Be aware that browser storage may be accessible to other applications running on the same device

## Compliance

The Easy Risk Register application has been designed to:
- Protect sensitive business risk data with client-side encryption
- Minimize data exposure by storing information locally
- Implement web security best practices to prevent common vulnerabilities
- Support accessibility standards while maintaining security

## Security Updates

Security updates are released as part of regular application updates. Users should:
- Keep the application updated to the latest version
- Review release notes for security-related changes
- Follow best practices for browser security

## Questions

For questions about this security policy or security measures in Easy Risk Register, please open an issue in the GitHub repository or contact the maintainers directly.