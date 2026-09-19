import { PrismaClient, Role, Priority, Status } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password,
      role: Role.ADMIN,
      avatarColor: '#6366f1',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      name: 'Manager User',
      password,
      role: Role.MANAGER,
      avatarColor: '#8b5cf6',
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@example.com' },
    update: {},
    create: {
      email: 'member@example.com',
      name: 'Member User',
      password,
      role: Role.MEMBER,
      avatarColor: '#22c55e',
    },
  });

  const tasks = [
    { title: 'Setup project repository', description: 'Initialize the repository with proper structure and configuration files.', priority: Priority.HIGH, status: Status.COMPLETED, creatorId: admin.id },
    { title: 'Design database schema', description: 'Create ERD and define all tables with proper relationships.', priority: Priority.HIGH, status: Status.COMPLETED, creatorId: admin.id },
    { title: 'Implement authentication', description: 'Add signup, login, logout, and session management.', priority: Priority.URGENT, status: Status.IN_PROGRESS, creatorId: admin.id },
    { title: 'Build task CRUD API', description: 'Create REST endpoints for task management.', priority: Priority.HIGH, status: Status.IN_PROGRESS, creatorId: manager.id },
    { title: 'Create dashboard UI', description: 'Design and implement the main dashboard with statistics.', priority: Priority.MEDIUM, status: Status.TODO, creatorId: manager.id },
    { title: 'Add real-time notifications', description: 'Implement WebSocket-based notifications for task updates.', priority: Priority.LOW, status: Status.TODO, creatorId: admin.id },
    { title: 'Write documentation', description: 'Create comprehensive README and API docs.', priority: Priority.MEDIUM, status: Status.TODO, creatorId: member.id },
    { title: 'Setup CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment.', priority: Priority.HIGH, status: Status.REVIEW, creatorId: admin.id },
  ];

  for (const taskData of tasks) {
    const task = await prisma.task.create({
      data: {
        ...taskData,
        dueDate: new Date(Date.now() + Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.taskAssignee.create({
      data: { taskId: task.id, userId: [admin.id, manager.id, member.id][Math.floor(Math.random() * 3)] },
    });
  }

  console.log('Seed completed:', { admin: admin.email, manager: manager.email, member: member.email });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
