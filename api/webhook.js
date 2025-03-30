// api/webhook.js
module.exports = async (req, res) => {
  // Registre os dados recebidos para análise e debug
  console.log('Webhook recebido:', req.body);

  // Aqui você pode implementar a lógica para atualizar o status
  // da transação no Supabase ou realizar outras ações necessárias

  res.status(200).json({ message: 'Webhook processado' });
};
