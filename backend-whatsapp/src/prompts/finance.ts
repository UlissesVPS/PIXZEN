export const FINANCE_EXTRACTION_PROMPT = `Você é um assistente financeiro especializado em extrair dados de transações financeiras.

REGRAS IMPORTANTES:
1. Se for um GASTO/DESPESA/COMPRA: type = "expense"
2. Se for RECEBIMENTO/ENTRADA/SALÁRIO/VENDA: type = "income"
3. Extraia o valor numérico (amount) - se não encontrar, retorne 0
4. Crie uma descrição curta e clara
5. Identifique a categoria mais apropriada
6. Adicione a data atual se não especificada
7. Indique sua confiança de 0 a 1

CATEGORIAS DISPONÍVEIS:

DESPESAS (expense):
- alimentacao: restaurantes, lanchonetes, delivery, iFood
- mercado: supermercado, feira, hortifruti
- transporte: uber, 99, taxi, ônibus, metrô
- combustivel: gasolina, etanol, diesel, posto
- saude: médico, farmácia, exames, dentista
- educacao: cursos, livros, escola, faculdade
- lazer: cinema, shows, jogos, streaming
- moradia: aluguel, condomínio, IPTU
- contas: luz, água, internet, telefone, gás
- roupas: vestuário, calçados, acessórios
- beleza: salão, barbearia, cosméticos
- pets: ração, veterinário, petshop
- viagem: passagens, hotel, hospedagem
- assinaturas: Netflix, Spotify, apps
- outros_despesa: quando não se encaixar em nenhuma

RECEITAS (income):
- salario: salário, pagamento, holerite, contracheque
- freelance: trabalho extra, bico, projeto
- investimentos: dividendos, rendimentos, juros
- vendas: venda de produto, marketplace
- presente: presente recebido, doação
- reembolso: reembolso, estorno, devolução
- aluguel: aluguel recebido
- outros_receita: quando não se encaixar em nenhuma

RESPONDA APENAS COM JSON VÁLIDO (sem markdown, sem explicações):
{
  "type": "income" ou "expense",
  "amount": número (use ponto como decimal, ex: 150.50),
  "description": "descrição curta em português",
  "category": "uma das categorias acima",
  "date": "data ISO (YYYY-MM-DDTHH:mm:ss.sssZ)",
  "confidence": número de 0 a 1
}

Se não conseguir identificar uma transação financeira válida, retorne:
{"type": "expense", "amount": 0, "description": "", "category": "outros_despesa", "date": "", "confidence": 0}`;

export const IMAGE_ANALYSIS_PROMPT = `Analise esta imagem de comprovante, nota fiscal, recibo ou extrato bancário.

${FINANCE_EXTRACTION_PROMPT}

INSTRUÇÕES ADICIONAIS PARA IMAGENS:
- Se for nota fiscal: extraia o valor TOTAL
- Se for comprovante de transferência: identifique se é entrada ou saída
- Se for extrato: foque na última transação visível
- Se houver múltiplos valores, use o TOTAL ou o valor principal
- Se a imagem estiver ilegível ou não for financeira, retorne amount: 0

IMPORTANTE - DATA:
- EXTRAIA a data que aparece NO COMPROVANTE/RECIBO
- A data do documento tem PRIORIDADE sobre a data atual
- SOMENTE use data atual se NAO houver data no documento`;

export const WELCOME_MESSAGE = `🎉 *Bem-vindo ao PixZen WhatsApp!*

Agora você pode registrar suas finanças por aqui de forma rápida e fácil!

📝 *Como usar:*

*Texto:* Apenas me conte o que gastou ou recebeu
• "Gastei 50 reais no mercado"
• "Recebi 1000 de salário"
• "Paguei 150 de luz"

🎤 *Áudio:* Grave um áudio me contando a transação

📷 *Foto:* Envie foto de comprovantes, notas fiscais ou recibos

Todas as transações aparecem automaticamente no seu app! 📱`;

export const HELP_MESSAGE = `📖 *Ajuda - PixZen WhatsApp*

*Comandos:*
• /ajuda - Mostra esta mensagem
• /saldo - Consulta seu saldo atual
• /resumo - Resumo do mês

*Exemplos de mensagens:*
💸 Despesas:
• "Gastei 35 no almoço"
• "Paguei 200 de internet"
• "Abasteci 150 de gasolina"

💰 Receitas:
• "Recebi 5000 de salário"
• "Entrou 500 de freelance"
• "Ganhei 100 de presente"

📷 Comprovantes:
• Envie fotos de notas fiscais
• Envie comprovantes PIX
• Envie recibos de pagamento

Dúvidas? Acesse o app ou fale com nosso suporte!`;

export const ERROR_MESSAGES = {
  NOT_REGISTERED: `❌ *Número não vinculado!*

Para usar o PixZen pelo WhatsApp, você precisa vincular seu número.

📱 Acesse o app PixZen:
⚙️ Configurações → WhatsApp → Vincular Número`,

  LIMIT_REACHED: `⚠️ *Limite de mensagens atingido!*

Você usou todas as mensagens do seu plano este mês.

💎 Faça upgrade para continuar usando:
Acesse o app → Configurações → Meu Plano`,

  PROCESSING_ERROR: `❌ *Ops! Algo deu errado.*

Não consegui processar sua mensagem.
Tente novamente em alguns segundos.

Se o erro persistir, use o app para registrar.`,

  INVALID_FORMAT: `🤔 *Não entendi sua mensagem.*

Tente de uma dessas formas:
• "Gastei [valor] em/no/na [descrição]"
• "Recebi [valor] de [descrição]"
• Envie foto de um comprovante

Exemplo: "Gastei 50 reais no mercado"`,

  GENERAL: '❌ Ops! Algo deu errado. Tente novamente em alguns segundos.',

  AUDIO_FAILED: '❌ Não consegui processar o áudio. Tente falar mais claramente ou envie uma mensagem de texto.',

  IMAGE_FAILED: '❌ Não consegui processar a imagem. Envie uma foto mais nítida do comprovante.',

  SAVE_FAILED: '❌ Não consegui salvar a transação. Tente novamente em alguns segundos.'
};
