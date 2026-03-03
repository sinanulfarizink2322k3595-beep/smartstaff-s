# AI-Powered Organization Builder

## Overview

The AI Organization Builder is a powerful feature that allows administrators to generate complete organizational structures using natural language prompts. It leverages OpenAI's GPT models to create departments, roles, and permissions tailored to your specific organization type.

## Features

### 1. **AI-Powered Generation**
- Describe your organization in plain English
- AI generates a complete hierarchical structure
- Includes departments, roles, and permissions
- Smart fallback system when AI is unavailable

### 2. **Smart Structure Design**
- **Departments**: Hierarchical department structure with unlimited nesting
- **Roles**: Custom roles with authority levels (1-10)
- **Permissions**: Fine-grained permissions for each role (create, read, update, delete, approve)
- **Visual Hierarchy**: Interactive tree view of your organization

### 3. **Database Integration**
- One-click apply to save structure to database
- Atomic transactions ensure data consistency
- Easy clearing and regeneration

## How to Use

### Step 1: Navigate to Organization Builder

1. Log in as an **ADMIN** user
2. Go to **Dashboard** → **AI Org Builder**

### Step 2: Generate Structure

1. Enter a prompt describing your organization:
   - "Create a school system with departments and faculty roles"
   - "Create an IT company structure with engineering and product teams"
   - "Create a hospital management system with medical departments"
   
2. Click **Generate Structure**

3. The AI will create:
   - Hierarchical departments
   - Role definitions with authority levels
   - Permissions for each role

### Step 3: Review Generated Structure

The preview shows:
- **Departments Tree**: Expandable/collapsible hierarchy with colors and icons
- **Roles Grid**: All roles with their levels and permissions
- **Department Assignments**: Which roles belong to which departments

### Step 4: Apply to Database

1. Review the generated structure
2. Click **Apply to Database**
3. The structure is saved and immediately available

### Step 5: Manage Structure

- **View Current Structure**: See your active organization structure
- **Clear Structure**: Remove all departments and roles to start fresh
- **Regenerate**: Create new structures as needed

## Example Prompts

### Educational Institutions
```
Create a university with engineering, arts, and sciences colleges
```
```
Create a high school with academic, sports, and administrative departments
```
```
Create a technical college with skill-based departments
```

### Healthcare
```
Create a hospital management system with medical, surgical, and administrative departments
```
```
Create a clinic with specialists and support staff
```

### Corporate
```
Create a tech startup with engineering, product, sales, and operations teams
```
```
Create a consulting firm with practice areas and support functions
```
```
Create a manufacturing company with production, quality, and logistics departments
```

### Government/Non-Profit
```
Create a local government structure with civic services
```
```
Create an NGO focused on education with program and operations teams
```

## Database Schema

### Department Model
```typescript
{
  id: string;
  name: string;
  description: string;
  level: number;          // 0 = root, 1 = child, 2 = grandchild
  color: string;          // #RRGGBB hex color
  icon: string;           // Icon name for UI
  parentId: string;       // Parent department (null for root)
  organizationId: string; // Multi-tenant isolation
}
```

### Custom Role Model
```typescript
{
  id: string;
  name: string;
  description: string;
  level: number;          // 1-10 (higher = more authority)
  departmentId: string;   // Optional department link
  organizationId: string;
}
```

### Permission Model
```typescript
{
  id: string;
  resource: string;       // "outpass", "meeting", "user", "department"
  action: string;         // "create", "read", "update", "delete", "approve"
  roleId: string;
}
```

## API Endpoints

### Generate Structure
```http
POST /api/orgbuilder/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Create a school system"
}
```

**Response:**
```json
{
  "success": true,
  "structure": {
    "organizationName": "Educational Institution",
    "description": "...",
    "departments": [...],
    "roles": [...]
  }
}
```

### Apply Structure
```http
POST /api/orgbuilder/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "structure": { /* generated structure object */ }
}
```

### Get Current Structure
```http
GET /api/orgbuilder/structure
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "departments": [...],
  "roles": [...],
  "stats": {
    "totalDepartments": 8,
    "totalRoles": 12,
    "maxLevel": 2
  }
}
```

### Clear Structure
```http
DELETE /api/orgbuilder/clear
Authorization: Bearer <token>
```

## Configuration

### OpenAI API Key

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to backend `.env`:
   ```env
   OPENAI_API_KEY="sk-your-key-here"
   ```

### Fallback Mode

If OpenAI API key is not configured, the system automatically uses smart fallbacks:
- School/University → Educational structure
- Hospital/Healthcare → Medical structure
- Company/Startup → Corporate structure

This allows testing without an API key.

## Technical Details

### AI Model Used
- **Model**: `gpt-4-turbo-preview`
- **Response Format**: JSON mode for structured output
- **Temperature**: 0.7 (balanced creativity/accuracy)
- **Max Tokens**: 2000

### System Prompt
The AI is instructed to:
- Generate realistic organizational structures
- Include 3-8 departments with 1-2 levels of nesting
- Create 4-12 roles with appropriate permissions
- Use practical department names and descriptions
- Assign colors and icons for visual representation

### Data Flow
```
User Input → AI Service → OpenAI API → Parse JSON → Preview
                                                      ↓
User Confirms → Controller → Database Transaction → Success
```

### Security
- ✅ ADMIN-only access
- ✅ Multi-tenant isolation (all records scoped to organizationId)
- ✅ Atomic transactions (all-or-nothing applies)
- ✅ Input validation on prompts and structure data
- ✅ JWT authentication required

## Troubleshooting

### "OpenAI API key not configured"
**Solution**: Set `OPENAI_API_KEY` in backend `.env` file, or use fallback mode.

### "Failed to generate structure"
**Causes**:
- Invalid OpenAI API key
- Network connectivity issues
- Rate limit exceeded

**Solution**: Check your API key, internet connection, or wait and retry.

### "Failed to apply structure"
**Causes**:
- Database connection issue
- Invalid structure data
- Duplicate department/role names

**Solution**: Check database connection and ensure unique names.

### Structure not appearing after apply
**Solution**: Refresh the page or click the refresh button in the Current Structure section.

## Best Practices

1. **Start Simple**: Use example prompts first to understand the system
2. **Be Specific**: More detailed prompts generate better structures
3. **Review Before Applying**: Always check the generated structure
4. **Clear Before Regenerating**: Clear old structures before applying new ones
5. **Backup**: Export or document important structures before clearing

## Future Enhancements

Planned features:
- [ ] Export structure as JSON/CSV
- [ ] Import structure from file
- [ ] Edit departments/roles individually
- [ ] Drag-and-drop reorganization
- [ ] Role templates library
- [ ] Permission presets
- [ ] Structure versioning
- [ ] Undo/redo functionality
- [ ] Real-time collaboration
- [ ] Structure comparison view

## Integration with Other Features

### User Management
- Users can be assigned to departments via `departmentId`
- Custom roles can be used alongside built-in roles (ADMIN, STAFF, STUDENT, SECURITY)

### Permissions System
- Generated permissions can control access to:
  - Outpass creation/approval
  - Meeting scheduling/approval
  - User management
  - Department management

### Dashboard Views
- Role-based dashboards can be customized based on custom roles
- Department-specific views can be created

## Support

For issues or questions:
1. Check this documentation
2. Review the [Setup Guide](../SETUP_GUIDE.md)
3. Check [Project Status](../PROJECT_STATUS.md) for known issues
4. Verify your OpenAI API key and database connection

---

**Last Updated**: February 28, 2026  
**Version**: 2.0.0  
**Feature Status**: ✅ Production Ready
