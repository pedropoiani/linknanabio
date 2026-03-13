/**
 * Calculadora de Terra Vegetal - Miraí Flores
 * Calcula a quantidade de terra necessária para vasos
 */

// ==========================================
// BANCO DE DADOS DOS PRODUTOS
// ==========================================

const EMBALAGENS = [
  { peso: 2,  litros: 2.5,   preco: 9,  nome: "Terra Vegetal 2kg" },
  { peso: 3,  litros: 4,     preco: 12, nome: "Terra Vegetal 3kg" },
  { peso: 5,  litros: 6.25,  preco: 15, nome: "Terra Vegetal 5kg" },
  { peso: 10, litros: 12,    preco: 20, nome: "Terra Vegetal 10kg" },
  { peso: 15, litros: 18.75, preco: 25, nome: "Terra Vegetal 15kg" },
  { peso: 20, litros: 25,    preco: 35, nome: "Terra Vegetal 20kg" },
  { peso: 25, litros: 31.25, preco: 45, nome: "Terra Vegetal 25kg" }
];

// ==========================================
// ESTADO DA CALCULADORA
// ==========================================

const estado = {
  tipoVaso: null,
  medidas: {},
  quantidadeVasos: 1,
  preenchimento: 0.9,
  litrosNecessarios: 0
};

// ==========================================
// FUNÇÕES DE CÁLCULO
// ==========================================

function calcularVasoRedondo(diametro, altura) {
  const raio = diametro / 2;
  return Math.PI * Math.pow(raio, 2) * altura;
}

function calcularVasoRetangular(comprimento, largura, altura) {
  return comprimento * largura * altura;
}

function calcularVasoAfunilado(diametroSuperior, diametroInferior, altura) {
  return (Math.PI * altura / 12) * (
    Math.pow(diametroSuperior, 2) +
    (diametroSuperior * diametroInferior) +
    Math.pow(diametroInferior, 2)
  );
}

function converterParaLitros(volumeCm3) {
  return volumeCm3 / 1000;
}

function calcularVolumeTotal() {
  let volumeCm3 = 0;

  switch (estado.tipoVaso) {
    case 'redondo':
      volumeCm3 = calcularVasoRedondo(estado.medidas.diametro, estado.medidas.altura);
      break;
    case 'retangular':
      volumeCm3 = calcularVasoRetangular(estado.medidas.comprimento, estado.medidas.largura, estado.medidas.altura);
      break;
    case 'afunilado':
      volumeCm3 = calcularVasoAfunilado(estado.medidas.diametroSuperior, estado.medidas.diametroInferior, estado.medidas.altura);
      break;
  }

  const litros = converterParaLitros(volumeCm3);
  return Math.round(litros * estado.preenchimento * estado.quantidadeVasos * 10) / 10;
}

function estimarPeso(litros) {
  return Math.round(litros * 0.8 * 10) / 10;
}

// ==========================================
// MOTOR DE RECOMENDAÇÃO
// ==========================================

/**
 * Busca todas as combinações viáveis de embalagens
 * que cobrem os litros necessários (até 150% do volume)
 */
function encontrarTodasCombinacoes(litrosNecessarios) {
  const resultados = [];
  // Ordena do maior para o menor para melhor poda
  const embs = [...EMBALAGENS].sort((a, b) => b.litros - a.litros);
  let count = 0;

  function buscar(index, itens, litrosTotal, precoTotal) {
    if (count++ > 200000) return;

    if (litrosTotal >= litrosNecessarios) {
      const filtrados = itens.filter(i => i.quantidade > 0);
      if (filtrados.length > 0) {
        resultados.push({
          itens: filtrados.map(i => ({ ...i })),
          totalLitros: Math.round(litrosTotal * 100) / 100,
          precoTotal: Math.round(precoTotal * 100) / 100,
          sobra: Math.round((litrosTotal - litrosNecessarios) * 100) / 100,
          totalPacotes: filtrados.reduce((s, i) => s + i.quantidade, 0)
        });
      }
      return;
    }

    if (index >= embs.length) return;

    const emb = embs[index];
    const falta = litrosNecessarios - litrosTotal;
    const maxQtd = Math.min(Math.ceil(falta / emb.litros) + 1, 20);

    for (let qtd = 0; qtd <= maxQtd; qtd++) {
      const novoLitros = litrosTotal + (qtd * emb.litros);
      // Não permite mais que 150% do necessário (exceto se for o mínimo para cobrir)
      if (novoLitros > litrosNecessarios * 1.5 && novoLitros > litrosNecessarios && qtd > 1) break;

      buscar(
        index + 1,
        [...itens, { peso: emb.peso, litros: emb.litros, preco: emb.preco, nome: emb.nome, quantidade: qtd }],
        novoLitros,
        precoTotal + (qtd * emb.preco)
      );
    }
  }

  buscar(0, [], 0, 0);
  return resultados;
}

/**
 * Seleciona as melhores recomendações entre todas as combinações
 */
function encontrarRecomendacoes(litrosNecessarios) {
  const todas = encontrarTodasCombinacoes(litrosNecessarios);

  if (todas.length === 0) {
    // Fallback: usa a maior embalagem
    const maior = EMBALAGENS[EMBALAGENS.length - 1];
    const qtd = Math.ceil(litrosNecessarios / maior.litros);
    return [{
      tipo: 'principal',
      titulo: 'Recomendação principal',
      itens: [{ ...maior, quantidade: qtd }],
      totalLitros: Math.round(qtd * maior.litros * 100) / 100,
      precoTotal: qtd * maior.preco,
      sobra: Math.round((qtd * maior.litros - litrosNecessarios) * 100) / 100,
      totalPacotes: qtd
    }];
  }

  // Ordena por preço, depois por menor sobra
  const porPreco = [...todas].sort((a, b) => a.precoTotal - b.precoTotal || a.sobra - b.sobra);

  // Ordena por menor número de pacotes, depois por preço
  const porPraticidade = [...todas].sort((a, b) => a.totalPacotes - b.totalPacotes || a.precoTotal - b.precoTotal);

  const recomendacoes = [];

  // 1. Recomendação principal: menor preço
  const principal = porPreco[0];
  principal.tipo = 'principal';
  principal.titulo = 'Recomendação principal';
  recomendacoes.push(principal);

  // 2. Mais prático: menos pacotes (se diferente da principal)
  const pratico = porPraticidade.find(c => !combinacoesIguais(c, principal));
  if (pratico) {
    pratico.tipo = 'pratico';
    pratico.titulo = 'Mais prático';
    recomendacoes.push(pratico);
  }

  // 3. Outra opção: próxima melhor por preço, diferente das anteriores
  const outra = porPreco.find(c =>
    !combinacoesIguais(c, principal) &&
    (!pratico || !combinacoesIguais(c, pratico))
  );
  if (outra) {
    outra.tipo = 'alternativa';
    outra.titulo = 'Outra opção';
    recomendacoes.push(outra);
  }

  return recomendacoes;
}

/**
 * Verifica se duas combinações são iguais
 */
function combinacoesIguais(a, b) {
  if (!a || !b || !a.itens || !b.itens) return false;
  if (a.itens.length !== b.itens.length) return false;

  const sortA = [...a.itens].sort((x, y) => x.peso - y.peso);
  const sortB = [...b.itens].sort((x, y) => x.peso - y.peso);

  return sortA.every((item, i) =>
    item.peso === sortB[i].peso && item.quantidade === sortB[i].quantidade
  );
}

// ==========================================
// FORMATAÇÃO
// ==========================================

function formatarItens(itens) {
  return itens.map(item => `${item.quantidade} ${item.nome}`).join(' + ');
}

function formatarPreco(valor) {
  return 'R$ ' + valor.toFixed(2).replace('.', ',');
}

function formatarLitros(valor) {
  return valor.toFixed(1).replace('.', ',') + 'L';
}

function formatarNumero(valor) {
  return valor.toFixed(1).replace('.', ',');
}

// ==========================================
// INTERFACE DO USUÁRIO
// ==========================================

let currentStep = 1;

function inicializarCalculadora() {
  // Tipo de vaso
  document.querySelectorAll('.pot-type-btn').forEach(btn => {
    btn.addEventListener('click', () => selecionarTipoVaso(btn.dataset.type));
    btn.querySelectorAll('*').forEach(child => {
      child.addEventListener('click', (e) => {
        e.stopPropagation();
        selecionarTipoVaso(btn.dataset.type);
      });
    });
  });

  // Preenchimento
  document.querySelectorAll('.preenchimento-btn').forEach(btn => {
    btn.addEventListener('click', () => selecionarPreenchimento(btn));
  });

  // Botão calcular
  document.getElementById('btn-calcular').addEventListener('click', calcularEMostrar);

  // Botão de voltar
  document.getElementById('btn-back-to-1').addEventListener('click', () => irParaStep(1));

  // Inputs (validação em tempo real)
  document.querySelectorAll('.medidas-form input').forEach(input => {
    input.addEventListener('input', validarMedidas);
  });

  document.getElementById('quantidade-vasos').addEventListener('input', (e) => {
    estado.quantidadeVasos = parseInt(e.target.value) || 1;
    validarMedidas();
  });

  // Recalcular
  document.getElementById('btn-recalcular').addEventListener('click', resetarCalculadora);
}

function selecionarTipoVaso(tipo) {
  estado.tipoVaso = tipo;

  document.querySelectorAll('.pot-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === tipo);
  });

  document.querySelectorAll('.medidas-form').forEach(form => form.style.display = 'none');
  document.getElementById(`medidas-${tipo}`).style.display = 'block';
  document.querySelector('.medidas-comum').style.display = 'block';

  irParaStep(2);
}

function selecionarPreenchimento(btn) {
  estado.preenchimento = parseFloat(btn.dataset.value);

  document.querySelectorAll('.preenchimento-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  validarMedidas();
}

function validarMedidas() {
  let valido = false;

  switch (estado.tipoVaso) {
    case 'redondo':
      const diametro = parseFloat(document.getElementById('diametro').value);
      const alturaR = parseFloat(document.getElementById('altura-redondo').value);
      valido = diametro > 0 && alturaR > 0;
      if (valido) estado.medidas = { diametro, altura: alturaR };
      break;

    case 'retangular':
      const comprimento = parseFloat(document.getElementById('comprimento').value);
      const largura = parseFloat(document.getElementById('largura').value);
      const alturaRet = parseFloat(document.getElementById('altura-retangular').value);
      valido = comprimento > 0 && largura > 0 && alturaRet > 0;
      if (valido) estado.medidas = { comprimento, largura, altura: alturaRet };
      break;

    case 'afunilado':
      const dSuperior = parseFloat(document.getElementById('diametro-superior').value);
      const dInferior = parseFloat(document.getElementById('diametro-inferior').value);
      const alturaA = parseFloat(document.getElementById('altura-afunilado').value);
      valido = dSuperior > 0 && dInferior > 0 && alturaA > 0;
      if (valido) estado.medidas = { diametroSuperior: dSuperior, diametroInferior: dInferior, altura: alturaA };
      break;
  }

  document.getElementById('btn-calcular').disabled = !valido;
  return valido;
}

function calcularEMostrar() {
  if (!validarMedidas()) return;
  calcularResultado();
  irParaStep(3);
}

function calcularResultado() {
  estado.litrosNecessarios = calcularVolumeTotal();
  const pesoEstimado = estimarPeso(estado.litrosNecessarios);

  // Exibe resumo
  document.getElementById('resultado-litros').textContent = formatarNumero(estado.litrosNecessarios);
  document.getElementById('resultado-peso').textContent = formatarNumero(pesoEstimado);

  // Busca recomendações
  const recomendacoes = encontrarRecomendacoes(estado.litrosNecessarios);

  // Recomendação principal
  if (recomendacoes.length > 0) {
    const principal = recomendacoes[0];
    mostrarRecomendacao('principal', principal);

    // Mais prático
    const pratico = recomendacoes.find(r => r.tipo === 'pratico');
    const elPratico = document.getElementById('recomendacao-pratico');
    if (pratico) {
      mostrarRecomendacao('pratico', pratico);
      elPratico.style.display = 'block';
    } else {
      elPratico.style.display = 'none';
    }

    // Alternativas
    const alternativas = recomendacoes.filter(r => r.tipo === 'alternativa');
    const containerAlt = document.getElementById('alternativas-container');
    if (alternativas.length > 0) {
      mostrarAlternativas(alternativas);
      containerAlt.style.display = 'block';
    } else {
      containerAlt.style.display = 'none';
    }

    configurarWhatsApp(principal);
  }
}

function mostrarRecomendacao(tipo, rec) {
  document.getElementById(`rec-${tipo}-itens`).textContent = formatarItens(rec.itens);
  document.getElementById(`rec-${tipo}-litros`).textContent =
    'Rendimento aproximado: ' + formatarLitros(rec.totalLitros);
  document.getElementById(`rec-${tipo}-preco`).textContent =
    'Preço estimado: ' + formatarPreco(rec.precoTotal);
}

function mostrarAlternativas(alternativas) {
  const lista = document.getElementById('alternativas-lista');
  lista.innerHTML = alternativas.map(alt => `
    <div class="alternativa-item">
      <div class="alternativa-titulo">${alt.titulo}</div>
      <div class="alternativa-descricao">${formatarItens(alt.itens)}</div>
      <div class="alternativa-info">
        <span>Rendimento: ${formatarLitros(alt.totalLitros)}</span>
        <span class="alt-preco">Preço: ${formatarPreco(alt.precoTotal)}</span>
      </div>
    </div>
  `).join('');
}

function configurarWhatsApp(recomendacao) {
  const textoItens = formatarItens(recomendacao.itens);

  const mensagem = encodeURIComponent(
    `Olá! Fiz a simulação na calculadora e preciso de:\n\n` +
    `${textoItens}\n` +
    `Rendimento: ${formatarLitros(recomendacao.totalLitros)}\n` +
    `Preço estimado: ${formatarPreco(recomendacao.precoTotal)}\n\n` +
    `Volume necessário: ${formatarNumero(estado.litrosNecessarios)} L para ${estado.quantidadeVasos} vaso(s).`
  );

  document.getElementById('btn-whatsapp-pedido').href =
    `https://api.whatsapp.com/send?phone=5522997517940&text=${mensagem}`;
}

function irParaStep(step) {
  currentStep = step;

  document.querySelectorAll('.calc-step').forEach((el, index) => {
    el.classList.toggle('active', index + 1 === step);
  });

  document.querySelectorAll('.progress-step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.toggle('active', s <= step);
    el.classList.toggle('current', s === step);
  });

  document.querySelector('.calc-step.active').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetarCalculadora() {
  estado.tipoVaso = null;
  estado.medidas = {};
  estado.quantidadeVasos = 1;
  estado.preenchimento = 0.9;
  estado.litrosNecessarios = 0;

  document.querySelectorAll('.medidas-form input').forEach(input => {
    input.value = input.id === 'quantidade-vasos' ? '1' : '';
  });

  document.querySelectorAll('.pot-type-btn').forEach(btn => btn.classList.remove('active'));

  document.querySelectorAll('.preenchimento-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === '0.9');
  });

  document.querySelectorAll('.medidas-form').forEach(form => form.style.display = 'none');
  document.querySelector('.medidas-comum').style.display = 'none';

  document.getElementById('btn-calcular').disabled = true;

  irParaStep(1);
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializarCalculadora);
