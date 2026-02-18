import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create admin user
  const passwordHash = await bcrypt.hash('admin123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      password_hash: passwordHash,
      name: 'Admin',
      is_admin: true,
    },
    create: {
      email: 'admin@gmail.com',
      password_hash: passwordHash,
      name: 'Admin',
      is_admin: true,
    },
  });

  console.log(`Admin user upserted: ${adminUser.id}`);

  // Create profile for admin
  await prisma.profile.upsert({
    where: { user_id: adminUser.id },
    update: { nome: 'Admin' },
    create: {
      user_id: adminUser.id,
      nome: 'Admin',
    },
  });

  console.log('Admin profile upserted');

  // Create assinante for admin
  await prisma.assinante.upsert({
    where: { user_id: adminUser.id },
    update: {
      status: 'ativo',
      plano: 'premium',
    },
    create: {
      user_id: adminUser.id,
      status: 'ativo',
      plano: 'premium',
    },
  });

  console.log('Admin assinante upserted');

  // 2. Create default AI configs
  const aiConfigs = [
    { config_key: 'model', config_value: 'gpt-4o-mini' },
    { config_key: 'temperature', config_value: '0.3' },
    { config_key: 'max_tokens', config_value: '500' },
    { config_key: 'vision_model', config_value: 'gpt-4o' },
    { config_key: 'system_prompt', config_value: '' },
  ];

  for (const config of aiConfigs) {
    await prisma.aIConfig.upsert({
      where: { config_key: config.config_key },
      update: { config_value: config.config_value },
      create: config,
    });
  }

  console.log(`AI configs upserted: ${aiConfigs.length} entries`);

  // 3. Create default message templates
  const templates = [
    {
      template_key: 'welcome_link',
      template_name: 'Boas-vindas Vinculacao',
      template_type: 'whatsapp',
      template_content:
        '*Conta vinculada com sucesso!* \u2705\n\nAgora voce pode registrar suas transacoes financeiras diretamente pelo WhatsApp!\n\n*Como usar:*\n\ud83d\udcdd Texto: "Almoco 35 reais"\n\ud83c\udfa4 Audio: Grave uma mensagem de voz\n\ud83d\udcf8 Foto: Envie foto de nota fiscal ou recibo\n\ud83d\udcc4 PDF: Envie documentos em PDF\n\nDigite /ajuda para ver todos os comandos.',
      variables: [] as string[],
    },
    {
      template_key: 'link_code',
      template_name: 'Codigo de Vinculacao',
      template_type: 'whatsapp',
      template_content:
        '\ud83d\udd17 *Vincule sua conta PixZen!*\n\nSeu codigo de vinculacao:\n*{{code}}*\n\nAcesse o app e insira este codigo na pagina de integracao WhatsApp.\n\n\u23f0 O codigo expira em 10 minutos.',
      variables: ['code'],
    },
    {
      template_key: 'trial_expired',
      template_name: 'Trial Expirado',
      template_type: 'whatsapp',
      template_content:
        '\u26a0\ufe0f *Seu periodo de teste expirou!*\n\nPara continuar usando o PixZen via WhatsApp, assine um dos nossos planos:\n\n\ud83d\udc8e *Premium* - R$ 29,90/mes\n\u2705 Mensagens ilimitadas\n\u2705 Audio, fotos e documentos\n\u2705 Relatorios detalhados\n\nAcesse: https://app.pixzen.site/settings',
      variables: [] as string[],
    },
    {
      template_key: 'error_limit_reached',
      template_name: 'Limite Atingido',
      template_type: 'whatsapp',
      template_content:
        '\u26a0\ufe0f *Limite mensal atingido!*\n\nVoce usou {{used}} de {{limit}} mensagens este mes.\n\nFaca upgrade para o plano Premium e tenha mensagens ilimitadas!\n\nAcesse: https://app.pixzen.site/settings',
      variables: ['used', 'limit'],
    },
  ];

  for (const template of templates) {
    await prisma.messageTemplate.upsert({
      where: { template_key: template.template_key },
      update: {
        template_name: template.template_name,
        template_type: template.template_type,
        template_content: template.template_content,
        variables: template.variables,
      },
      create: template,
    });
  }

  console.log(`Message templates upserted: ${templates.length} entries`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
