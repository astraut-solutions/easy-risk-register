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