# Technical Architecture  
  
This document details the technical architecture components implemented in the Easy Risk Register project, focusing on the advanced features for real-time processing, data analytics, and system integrations.  
  
## Real-time Processing Engine 
The real-time processing engine enables continuous risk updates across multiple users and systems. Key features include:  
  
- WebSocket-based communication using Socket.io  
- Real-time risk synchronization between clients  
- Event-driven architecture for immediate updates  
- Connection management with reconnection capabilities  
- Room-based updates for specific risk items  
  
### Implementation Details  
  
The real-time service is implemented as a singleton class that manages WebSocket connections and provides event handling for risk updates. It supports:  
- Risk creation, update, and deletion broadcasts  
- Connection status monitoring  
- Error handling and reconnection logic  
- Event subscription and unsubscription  
  
## Time-Series Database Integration 
Historical trend analysis is enabled through integration with time-series databases, specifically InfluxDB. This allows for:  
  
- Historical risk data storage and retrieval  
- Trend analysis and visualization  
- Risk exposure tracking over time  
- Statistical analysis of risk patterns  
  
### Implementation Details  
  
The time-series service provides:  
- Risk trend data storage with timestamps  
- Query capabilities for specific risks or categories  
- Bulk operations for multiple risk trends  
- Exposure summary calculations  
- Configurable retention policies  
  
## Graph Database for Risk Relationships 
Risk relationship modeling is implemented using graph database concepts to understand dependencies and correlations between risks:  
  
- Risk dependency mapping  
- Impact analysis across related risks  
- Pathfinding between interconnected risks  
- Visual representation of risk relationships  
  
### Implementation Details  
  
The graph database service includes:  
- Node management for risks, threats, controls, and assets  
- Relationship mapping between risk entities  
- Pathfinding algorithms to identify risk chains  
- Impact analysis based on relationship strength  
  
## Vulnerability Scanner Integration
Integration with external vulnerability scanners allows for automated risk import and correlation:

- Support for multiple scanner types (OpenVAS, ZAP, Nikto)
- Automated vulnerability-to-risk conversion
- Risk correlation with existing vulnerabilities
- Import/export capabilities for scan results

### Implementation Details

The vulnerability scanner service provides:
- Configuration management for different scanner types
- Scan initiation and result retrieval
- Vulnerability-to-risk mapping algorithms
- Export capabilities in multiple formats (JSON, CSV, HTML)

## SIEM System Integration
Security Information and Event Management (SIEM) integration enables correlation of security events with business risks:

- Support for multiple SIEM platforms (Wazuh, ELK Stack, Security Onion)
- Security event to risk conversion
- Alert correlation with existing risks
- Event statistics and analysis

### Implementation Details

The SIEM integration service includes:
- Configuration management for different SIEM types
- Security event fetching and processing
- Alert-to-risk conversion functionality
- Event correlation with existing risk register
- Statistics and reporting capabilities

## Asset Management/CMDB System Integration
Integration with asset management and Configuration Management Database (CMDB) systems enables tracking of risks associated with specific assets:

- Support for multiple CMDB platforms (DataGerry, CMDBuild, Snipe-IT)
- Asset-to-risk correlation and mapping
- Critical asset identification and risk assessment
- Asset group and category management

### Implementation Details

The asset management service includes:
- Configuration management for different CMDB types
- Asset fetching and categorization
- Asset-to-risk conversion functionality
- Asset group management and correlation
- Criticality assessment and risk mapping

## Third-Party API Integration Framework
A comprehensive framework for integrating with third-party systems using REST and GraphQL APIs:

- Support for multiple authentication methods (API Key, OAuth, Basic, JWT)
- Flexible data mapping and transformation
- Real-time update subscription capabilities
- GraphQL and REST API support

### Implementation Details

The API integration service includes:
- Authentication management for various methods
- REST API call utilities with error handling
- GraphQL query execution capabilities
- Data transformation and mapping utilities
- Real-time update subscription mechanisms
  
## Microservices Architecture Design 
The system is designed with a microservices architecture for scalability and maintainability:  
  
- Decoupled services for different functionalities  
- API-based communication between services  
- Independent deployment capabilities  
- Resilient service communication patterns  
  
### Service Components  
  
1. **Risk Management Service**: Core risk data management  
2. **Real-time Service**: WebSocket connections and live updates  
3. **Time Series Service**: Historical data storage and analysis  
4. **Graph Database Service**: Risk relationship modeling  
5. **Vulnerability Scanner Integration Service**: External scanner connections  
6. **SIEM Integration Service**: Security event correlation  
## Frontend Integration 
All backend services are integrated into the frontend through dedicated service layers that provide:  
  
- Consistent API interfaces  
- Error handling and retry logic  
- State management integration  
- React hooks for component usage  
  
## Security Considerations  
  
- API rate limiting  
- JWT token validation  
- Input validation and sanitization  
- HTTPS enforcement  
- Environment variable management  
- Database access controls  
 - Do not ship secrets to the browser (no API keys/tokens in `VITE_*`; use serverless APIs for credentialed calls)  
  
## Deployment Architecture  
  
- Frontend: React app deployed on Vercel  
- Backend: NestJS/Express APIs deployed as Vercel serverless functions  
- Databases: External services (InfluxDB, Neo4j, etc.)  
- Caching: Redis (external provider)  
- Authentication: JWT tokens or OAuth providers  
  
  
## Monitoring & Observability  
  
- API logging and monitoring  
- Performance metrics  
- Error tracking  
- Health checks  
- Distributed tracing 
