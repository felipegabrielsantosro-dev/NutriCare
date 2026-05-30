/**
 * Seed único master - NutriCare
 */

exports.seed = async function (knex) {
  // 🔥 LIMPA TUDO
  await knex.raw(`
    TRUNCATE TABLE 
      plano_alimentar,
      medidas_corporais,
      historico_exercicios,
      dietas,
      exercicios,
      alimentos,
      users
    RESTART IDENTITY CASCADE
  `);

  // =========================
  // 👤 USERS
  // =========================
  await knex('users').insert([
    {
      id: 1,
      nome: 'Admin User',
      email: 'admin@exemplo.com',
      senha: '123456',
      idade: 25,
      sexo: 'M',
      altura: 1.75,
      peso: 70,
    },
    {
      id: 2,
      nome: 'João Silva',
      email: 'joao@exemplo.com',
      senha: '123456',
      idade: 30,
      sexo: 'M',
      altura: 1.80,
      peso: 80,
    }
  ]);

  // =========================
  // 🍎 ALIMENTOS
  // =========================
  await knex('alimentos').insert([
    {
      id: 1,
      nome: 'Arroz',
      calorias: 130,
      carboidratos: 28,
      proteinas: 2.5,
      gorduras: 0.3,
      fibras: 0.4,
      sodio: 1,
      porcao: '100g'
    },
    {
      id: 2,
      nome: 'Frango',
      calorias: 165,
      carboidratos: 0,
      proteinas: 31,
      gorduras: 3.6,
      fibras: 0,
      sodio: 70,
      porcao: '100g'
    }
  ]);

  // =========================
  // 🥗 DIETAS
  // =========================
  await knex('dietas').insert([
    {
      id: 1,
      usuario_id: 1,
      nome: 'Dieta Hipertrofia',  
      calorias_totais: 2800
    },
    {
      id: 2,
      usuario_id: 2,
      nome: 'Dieta Definição',
      calorias_totais: 1800
    }
  ]);

  // =========================
  // 🏋️ EXERCÍCIOS
  // =========================
  await knex('exercicios').insert([
    {
      id: 1,
      nome: 'Corrida',
      calorias_por_hora: 600,
      categoria: 'Cardio'
    },
    {
      id: 2,
      nome: 'Musculação',
      calorias_por_hora: 300,
      categoria: 'Força'
    }
  ]);

  // =========================
  // 📊 HISTÓRICO EXERCÍCIOS (🔴 CORRIGIDO)
  // =========================
  await knex('historico_exercicios').insert([
    {
      id: 1,
      usuario_id: 1,
      exercicio_id: 1,
      duracao: 30,
      calorias_gastas: 300,
      data: '2026-01-01'
    }
  ]);

  // =========================
  // ⚖️ MEDIDAS CORPORAIS
  // =========================
  await knex('medidas_corporais').insert([
    {
      id: 1,
      usuario_id: 1,
      peso: 70,
      imc: 22.9,
      cintura: 80,
      percentual_gordura: 15.5
    }
  ]);

  // =========================
  // 🍽 PLANO ALIMENTAR
  // =========================
  await knex('plano_alimentar').insert([
    {
      id: 1,
      dieta_id: 1,
      refeicao: 'Café da manhã',
      horario: '08:00:00',
      alimento_id: 1,
      quantidade: 100
    },
    {
      id: 2,
      dieta_id: 1,
      refeicao: 'Almoço',
      horario: '12:00:00',
      alimento_id: 2,
      quantidade: 150
    }
  ]);
};