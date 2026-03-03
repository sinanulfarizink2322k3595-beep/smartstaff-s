import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedDepartment {
  name: string;
  description: string;
  level: number;
  color?: string;
  icon?: string;
  children?: GeneratedDepartment[];
}

export interface GeneratedRole {
  name: string;
  description: string;
  level: number;
  departmentName?: string;
  permissions: {
    resource: string;
    action: string;
  }[];
}

export interface OrganizationStructure {
  organizationName: string;
  description: string;
  departments: GeneratedDepartment[];
  roles: GeneratedRole[];
}

const SYSTEM_PROMPT = `You are an expert organization structure designer. When given a prompt describing an organization type, generate a comprehensive organizational structure including:

1. Departments (with hierarchy)
2. Roles within those departments
3. Permissions for each role

Return ONLY valid JSON with this exact structure:
{
  "organizationName": "string",
  "description": "string",
  "departments": [
    {
      "name": "string",
      "description": "string",
      "level": 0,
      "color": "#hexcolor",
      "icon": "icon-name",
      "children": [/* nested departments */]
    }
  ],
  "roles": [
    {
      "name": "string",
      "description": "string",
      "level": 1-10,
      "departmentName": "string",
      "permissions": [
        { "resource": "outpass|meeting|user|department", "action": "create|read|update|delete|approve" }
      ]
    }
  ]
}

Guidelines:
- Use common department structures for the organization type
- Higher level numbers = more authority (10 = CEO level, 1 = entry level)
- Include 3-8 departments with 1-2 levels of nesting
- Include 4-12 roles with appropriate permissions
- Use realistic department names and descriptions
- Colors should be hex format (#RRGGBB)
- Icons can be: users, building, shield, briefcase, chart, cog, heart, etc.`;

export class AIService {
  async generateOrganizationStructure(prompt: string): Promise<OrganizationStructure> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { 
            role: 'user', 
            content: `Generate an organization structure for: ${prompt}` 
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const structure = JSON.parse(content) as OrganizationStructure;
      
      // Validate the structure
      if (!structure.departments || !Array.isArray(structure.departments)) {
        throw new Error('Invalid structure: missing departments array');
      }
      if (!structure.roles || !Array.isArray(structure.roles)) {
        throw new Error('Invalid structure: missing roles array');
      }

      return structure;
    } catch (error: any) {
      console.error('AI Service Error:', error);
      
      // Return a fallback structure if AI fails
      if (error.message?.includes('API key')) {
        throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in environment variables.');
      }
      
      throw new Error(`Failed to generate organization structure: ${error.message}`);
    }
  }

  // Fallback manual structure for testing without API key
  generateFallbackStructure(prompt: string): OrganizationStructure {
    const type = prompt.toLowerCase();
    
    if (type.includes('school') || type.includes('university') || type.includes('college')) {
      return {
        organizationName: 'Educational Institution',
        description: 'A comprehensive school management system',
        departments: [
          {
            name: 'Academic Affairs',
            description: 'Handles all academic programs and curriculum',
            level: 0,
            color: '#3B82F6',
            icon: 'building',
            children: [
              {
                name: 'Computer Science',
                description: 'CS and IT programs',
                level: 1,
                color: '#8B5CF6',
                icon: 'chart',
              },
              {
                name: 'Mathematics',
                description: 'Mathematics department',
                level: 1,
                color: '#10B981',
                icon: 'chart',
              },
            ],
          },
          {
            name: 'Administration',
            description: 'Administrative operations',
            level: 0,
            color: '#F59E0B',
            icon: 'briefcase',
          },
          {
            name: 'Student Affairs',
            description: 'Student services and support',
            level: 0,
            color: '#EC4899',
            icon: 'users',
          },
        ],
        roles: [
          {
            name: 'Principal',
            description: 'Head of institution',
            level: 10,
            permissions: [
              { resource: 'user', action: 'create' },
              { resource: 'user', action: 'read' },
              { resource: 'user', action: 'update' },
              { resource: 'user', action: 'delete' },
              { resource: 'department', action: 'create' },
              { resource: 'outpass', action: 'approve' },
              { resource: 'meeting', action: 'approve' },
            ],
          },
          {
            name: 'Department Head',
            description: 'Head of academic department',
            level: 8,
            departmentName: 'Computer Science',
            permissions: [
              { resource: 'outpass', action: 'approve' },
              { resource: 'meeting', action: 'approve' },
              { resource: 'user', action: 'read' },
            ],
          },
          {
            name: 'Faculty',
            description: 'Teaching staff',
            level: 5,
            departmentName: 'Computer Science',
            permissions: [
              { resource: 'outpass', action: 'approve' },
              { resource: 'meeting', action: 'read' },
              { resource: 'meeting', action: 'approve' },
            ],
          },
          {
            name: 'Student',
            description: 'Enrolled student',
            level: 1,
            permissions: [
              { resource: 'outpass', action: 'create' },
              { resource: 'outpass', action: 'read' },
              { resource: 'meeting', action: 'create' },
              { resource: 'meeting', action: 'read' },
            ],
          },
        ],
      };
    }
    
    if (type.includes('hospital') || type.includes('healthcare') || type.includes('medical')) {
      return {
        organizationName: 'Healthcare Facility',
        description: 'Hospital management system',
        departments: [
          {
            name: 'Medical Services',
            description: 'Patient care departments',
            level: 0,
            color: '#EF4444',
            icon: 'heart',
            children: [
              {
                name: 'Emergency',
                description: 'Emergency care',
                level: 1,
                color: '#DC2626',
                icon: 'shield',
              },
              {
                name: 'Surgery',
                description: 'Surgical operations',
                level: 1,
                color: '#F87171',
                icon: 'heart',
              },
            ],
          },
          {
            name: 'Administration',
            description: 'Hospital administration',
            level: 0,
            color: '#3B82F6',
            icon: 'briefcase',
          },
          {
            name: 'Support Services',
            description: 'Support and auxiliary services',
            level: 0,
            color: '#8B5CF6',
            icon: 'cog',
          },
        ],
        roles: [
          {
            name: 'Chief Medical Officer',
            description: 'Head of medical operations',
            level: 10,
            permissions: [
              { resource: 'user', action: 'create' },
              { resource: 'user', action: 'read' },
              { resource: 'user', action: 'update' },
              { resource: 'department', action: 'create' },
            ],
          },
          {
            name: 'Department Head',
            description: 'Head of medical department',
            level: 8,
            departmentName: 'Emergency',
            permissions: [
              { resource: 'user', action: 'read' },
              { resource: 'outpass', action: 'approve' },
            ],
          },
          {
            name: 'Doctor',
            description: 'Medical practitioner',
            level: 6,
            departmentName: 'Emergency',
            permissions: [
              { resource: 'meeting', action: 'read' },
              { resource: 'meeting', action: 'approve' },
            ],
          },
          {
            name: 'Nurse',
            description: 'Nursing staff',
            level: 4,
            departmentName: 'Emergency',
            permissions: [
              { resource: 'meeting', action: 'read' },
            ],
          },
        ],
      };
    }
    
    // Default IT company structure
    return {
      organizationName: 'Technology Company',
      description: 'Software development and IT services',
      departments: [
        {
          name: 'Engineering',
          description: 'Software development and engineering',
          level: 0,
          color: '#3B82F6',
          icon: 'chart',
          children: [
            {
              name: 'Frontend',
              description: 'Frontend development',
              level: 1,
              color: '#60A5FA',
              icon: 'chart',
            },
            {
              name: 'Backend',
              description: 'Backend development',
              level: 1,
              color: '#2563EB',
              icon: 'chart',
            },
          ],
        },
        {
          name: 'Product',
          description: 'Product management',
          level: 0,
          color: '#10B981',
          icon: 'briefcase',
        },
        {
          name: 'Operations',
          description: 'Business operations',
          level: 0,
          color: '#F59E0B',
          icon: 'cog',
        },
      ],
      roles: [
        {
          name: 'CTO',
          description: 'Chief Technology Officer',
          level: 10,
          permissions: [
            { resource: 'user', action: 'create' },
            { resource: 'user', action: 'read' },
            { resource: 'user', action: 'update' },
            { resource: 'user', action: 'delete' },
            { resource: 'department', action: 'create' },
          ],
        },
        {
          name: 'Engineering Manager',
          description: 'Manages engineering teams',
          level: 8,
          departmentName: 'Engineering',
          permissions: [
            { resource: 'user', action: 'read' },
            { resource: 'outpass', action: 'approve' },
            { resource: 'meeting', action: 'approve' },
          ],
        },
        {
          name: 'Senior Engineer',
          description: 'Senior software engineer',
          level: 6,
          departmentName: 'Frontend',
          permissions: [
            { resource: 'meeting', action: 'create' },
            { resource: 'meeting', action: 'read' },
          ],
        },
        {
          name: 'Engineer',
          description: 'Software engineer',
          level: 4,
          departmentName: 'Backend',
          permissions: [
            { resource: 'outpass', action: 'create' },
            { resource: 'outpass', action: 'read' },
            { resource: 'meeting', action: 'create' },
            { resource: 'meeting', action: 'read' },
          ],
        },
      ],
    };
  }
}

export const aiService = new AIService();
