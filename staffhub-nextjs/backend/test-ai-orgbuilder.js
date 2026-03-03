/**
 * Standalone Test for AI Organization Builder
 * 
 * This script tests the AI organization structure generation
 * without requiring database setup. Perfect for testing the
 * AI integration before deploying the full system.
 * 
 * Usage:
 *   node test-ai-orgbuilder.js
 * 
 * Or with a custom prompt:
 *   node test-ai-orgbuilder.js "Create a tech startup"
 */

require('dotenv').config();

// Simple inline AI service for testing
class TestAIService {
  async generateStructure(prompt) {
    console.log('\n🤖 Generating organization structure...');
    console.log(`📝 Prompt: "${prompt}"\n`);

    const hasAPIKey = process.env.OPENAI_API_KEY && 
                      process.env.OPENAI_API_KEY !== 'your-openai-api-key-here' &&
                      process.env.OPENAI_API_KEY.startsWith('sk-');

    if (hasAPIKey) {
      console.log('🔑 OpenAI API Key detected - Using AI generation\n');
      try {
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are an expert organization structure designer. Generate a comprehensive organizational structure in JSON format with departments (with hierarchy) and roles (with permissions).`
            },
            {
              role: 'user',
              content: `Generate an organization structure for: ${prompt}`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 2000,
        });

        return JSON.parse(completion.choices[0].message.content);
      } catch (error) {
        console.log('⚠️  AI generation failed, using fallback\n');
        console.log(`Error: ${error.message}\n`);
        return this.generateFallback(prompt);
      }
    } else {
      console.log('📋 No API Key - Using smart fallback templates\n');
      return this.generateFallback(prompt);
    }
  }

  generateFallback(prompt) {
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
        ],
        roles: [
          {
            name: 'Principal',
            description: 'Head of institution',
            level: 10,
            permissions: [
              { resource: 'user', action: 'create' },
              { resource: 'department', action: 'create' },
              { resource: 'outpass', action: 'approve' },
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
            ],
          },
          {
            name: 'Faculty',
            description: 'Teaching staff',
            level: 5,
            permissions: [
              { resource: 'outpass', action: 'approve' },
              { resource: 'meeting', action: 'approve' },
            ],
          },
          {
            name: 'Student',
            description: 'Enrolled student',
            level: 1,
            permissions: [
              { resource: 'outpass', action: 'create' },
              { resource: 'meeting', action: 'create' },
            ],
          },
        ],
      };
    }

    if (type.includes('hospital') || type.includes('healthcare')) {
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
        ],
        roles: [
          {
            name: 'Chief Medical Officer',
            description: 'Head of medical operations',
            level: 10,
            permissions: [
              { resource: 'user', action: 'create' },
              { resource: 'department', action: 'create' },
            ],
          },
          {
            name: 'Doctor',
            description: 'Medical practitioner',
            level: 6,
            departmentName: 'Emergency',
            permissions: [
              { resource: 'meeting', action: 'approve' },
            ],
          },
        ],
      };
    }

    // Default: IT company
    return {
      organizationName: 'Technology Company',
      description: 'Software development and IT services',
      departments: [
        {
          name: 'Engineering',
          description: 'Software development',
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
      ],
      roles: [
        {
          name: 'CTO',
          description: 'Chief Technology Officer',
          level: 10,
          permissions: [
            { resource: 'user', action: 'create' },
            { resource: 'department', action: 'create' },
          ],
        },
        {
          name: 'Engineering Manager',
          description: 'Manages engineering teams',
          level: 8,
          departmentName: 'Engineering',
          permissions: [
            { resource: 'outpass', action: 'approve' },
            { resource: 'meeting', action: 'approve' },
          ],
        },
        {
          name: 'Engineer',
          description: 'Software engineer',
          level: 4,
          departmentName: 'Backend',
          permissions: [
            { resource: 'outpass', action: 'create' },
            { resource: 'meeting', action: 'create' },
          ],
        },
      ],
    };
  }
}

// Display functions
function displayDepartments(departments, indent = 0) {
  for (const dept of departments) {
    const prefix = '  '.repeat(indent);
    console.log(`${prefix}📁 ${dept.name} ${dept.color || ''}`);
    console.log(`${prefix}   ${dept.description}`);
    console.log(`${prefix}   Level: ${dept.level}\n`);
    
    if (dept.children && dept.children.length > 0) {
      displayDepartments(dept.children, indent + 1);
    }
  }
}

function displayRoles(roles) {
  for (const role of roles) {
    console.log(`👤 ${role.name} (Level ${role.level})`);
    console.log(`   ${role.description}`);
    if (role.departmentName) {
      console.log(`   Department: ${role.departmentName}`);
    }
    if (role.permissions && role.permissions.length > 0) {
      console.log(`   Permissions: ${role.permissions.map(p => `${p.resource}:${p.action}`).join(', ')}`);
    }
    console.log('');
  }
}

// Main test function
async function testOrgBuilder() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     AI Organization Builder - Standalone Test             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get prompt from command line or use default
  const prompt = process.argv[2] || 'Create a university system';

  const service = new TestAIService();

  try {
    const structure = await service.generateStructure(prompt);

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`🏢 Organization: ${structure.organizationName}`);
    console.log(`📋 Description: ${structure.description}\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📊 DEPARTMENTS HIERARCHY:\n');
    displayDepartments(structure.departments);

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('👥 ROLES & PERMISSIONS:\n');
    displayRoles(structure.roles);

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📈 STATISTICS:');
    console.log(`   Total Departments: ${countDepartments(structure.departments)}`);
    console.log(`   Total Roles: ${structure.roles.length}`);
    console.log(`   Max Department Level: ${getMaxLevel(structure.departments)}\n`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('✅ Test completed successfully!\n');
    console.log('💡 Tips:');
    console.log('   - Add OPENAI_API_KEY to .env for AI-powered generation');
    console.log('   - Run with custom prompt: node test-ai-orgbuilder.js "your prompt"');
    console.log('   - Set up PostgreSQL to save structures to database\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function countDepartments(departments) {
  let count = departments.length;
  for (const dept of departments) {
    if (dept.children) {
      count += countDepartments(dept.children);
    }
  }
  return count;
}

function getMaxLevel(departments) {
  let max = 0;
  for (const dept of departments) {
    max = Math.max(max, dept.level);
    if (dept.children) {
      max = Math.max(max, getMaxLevel(dept.children));
    }
  }
  return max;
}

// Run the test
testOrgBuilder();
