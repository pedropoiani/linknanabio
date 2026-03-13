/**
 * Calculadora de Terra e Substrato - Miraí Flores
 * Calcula a quantidade de terra/substrato necessária para vasos
 */

// ==========================================
// BANCO DE DADOS DOS PRODUTOS
// ==========================================

const PRODUTOS = {
  terra: {
    nome: "Terra Vegetal com Húmus",
    tipo: "terra",
    descricao: "Ideal para vasos, jardins e plantio em geral",
    imagem: "https://framerusercontent.com/images/5qSyVdImp5lROAiM9Jc25nTEA.png",
    embalagens: [
      { peso: 2, litros: 2.5, nome: "Terra Vegetal com Húmus 2kg" },
      { peso: 3, litros: 4, nome: "Terra Vegetal com Húmus 3kg" },
      { peso: 10, litros: 12, nome: "Terra Vegetal com Húmus 10kg" },
      { peso: 15, litros: 18, nome: "Terra Vegetal com Húmus 15kg" },
      { peso: 20, litros: 25, nome: "Terra Vegetal com Húmus 20kg" },
      { peso: 25, litros: 31, nome: "Terra Vegetal com Húmus 25kg" }
    ]
  },
  "substrato-40l": {
    nome: "Substrato 40L",
    tipo: "substrato",
    descricao: "Substrato pronto para plantio",
    imagem: "https://framerusercontent.com/images/94y3zK02aEFLB1qSIYhYjcfyDE.png",
    embalagens: [
      { peso: 20, litros: 40, nome: "Substrato 40L" }
    ]
  },
  "rosa-deserto": {
    nome: "Substrato Rosa do Deserto 10kg",
    tipo: "substrato-especial",
    descricao: "Formulação especial para rosa do deserto",
    imagem: "https://framerusercontent.com/images/94y3zK02aEFLB1qSIYhYjcfyDE.png",
    embalagens: [
      { peso: 10, litros: 14, nome: "Substrato Rosa do Deserto 10kg" }
    ]
  },
  "flores-folhagens": {
    nome: "Substrato Flores e Folhagens 10kg",
    tipo: "substrato-especial",
    descricao: "Ideal para plantas ornamentais",
    imagem: "https://framerusercontent.com/images/94y3zK02aEFLB1qSIYhYjcfyDE.png",
    embalagens: [
      { peso: 10, litros: 14, nome: "Substrato Flores e Folhagens 10kg" }
    ]
  }
};

// ==========================================
// ESTADO DA CALCULADORA
// ==========================================

const estado = {
  tipoVaso: null,
  medidas: {},
  quantidadeVasos: 1,
  preenchimento: 0.9,
  tipoProduto: null,
  litrosNecessarios: 0
};

// ==========================================
// FUNÇÕES DE CÁLCULO
// ==========================================

/**
 * Calcula volume de vaso redondo (cilindro)
 * V = π × r² × h
 */
function calcularVasoRedondo(diametro, altura) {
  const raio = diametro / 2;
  return Math.PI * Math.pow(raio, 2) * altura;
}

/**
 * Calcula volume de vaso retangular (paralelepípedo)
 * V = comprimento × largura × altura
 */
function calcularVasoRetangular(comprimento, largura, altura) {
  return comprimento * largura * altura;
}

/**
 * Calcula volume de vaso afunilado (tronco de cone)
 * V = (π × h ÷ 12) × (D1² + D1×D2 + D2²)
 */
function calcularVasoAfunilado(diametroSuperior, diametroInferior, altura) {
  const d1 = diametroSuperior;
  const d2 = diametroInferior;
  return (Math.PI * altura / 12) * (Math.pow(d1, 2) + (d1 * d2) + Math.pow(d2, 2));
}

/**
 * Converte volume em cm³ para litros
 */
function converterParaLitros(volumeCm3) {
  return volumeCm3 / 1000;
}

/**
 * Calcula o volume total necessário considerando quantidade e preenchimento
 */
function calcularVolumeTotal() {
  let volumeCm3 = 0;

  switch (estado.tipoVaso) {
    case 'redondo':
      volumeCm3 = calcularVasoRedondo(
        estado.medidas.diametro,
        estado.medidas.altura
      );
      break;
    case 'retangular':
      volumeCm3 = calcularVasoRetangular(
        estado.medidas.comprimento,
        estado.medidas.largura,
        estado.medidas.altura
      );
      break;
    case 'afunilado':
      volumeCm3 = calcularVasoAfunilado(
        estado.medidas.diametroSuperior,
        estado.medidas.diametroInferior,
        estado.medidas.altura
      );
      break;
  }

  const litros = converterParaLitros(volumeCm3);
  const litrosAjustados = litros * estado.preenchimento * estado.quantidadeVasos;

  return Math.round(litrosAjustados * 10) / 10;
}

/**
 * Estima o peso baseado nos litros (média de 0.8 kg/L para terra)
 */
function estimarPeso(litros) {
  return Math.round(litros * 0.8 * 10) / 10;
}

// ==========================================
// MOTOR DE RECOMENDAÇÃO
// ==========================================

/**
 * Encontra as melhores combinações de embalagens para atender a necessidade
 */
function encontrarRecomendacoes(litrosNecessarios, produto) {
  const embalagens = produto.embalagens;
  const recomendacoes = [];

  // Ordena embalagens do maior para o menor
  const embalagensSorted = [...embalagens].sort((a, b) => b.litros - a.litros);

  // 1. Opção com menor quantidade de embalagens (maior embalagem possível)
  const opcaoEconomica = calcularOpcaoGreedy(litrosNecessarios, embalagensSorted);
  if (opcaoEconomica) {
    recomendacoes.push({
      tipo: 'economica',
      titulo: 'Opção Econômica',
      ...opcaoEconomica
    });
  }

  // 2. Opção com menor sobra
  const opcaoExata = calcularOpcaoExata(litrosNecessarios, embalagens);
  if (opcaoExata && !combinacoesIguais(opcaoExata, opcaoEconomica)) {
    recomendacoes.push({
      tipo: 'exata',
      titulo: 'Menor Sobra',
      ...opcaoExata
    });
  }

  // 3. Se houver apenas uma embalagem, opção de múltiplas unidades
  if (embalagens.length === 1) {
    const emb = embalagens[0];
    const qtd = Math.ceil(litrosNecessarios / emb.litros);
    const totalLitros = qtd * emb.litros;
    recomendacoes.push({
      tipo: 'unica',
      titulo: 'Recomendação',
      itens: [{ ...emb, quantidade: qtd }],
      totalLitros,
      sobra: totalLitros - litrosNecessarios
    });
  }

  // 4. Adicionar opções alternativas com embalagens menores
  if (embalagens.length > 1) {
    const opcaoAlternativa = calcularOpcaoAlternativa(litrosNecessarios, embalagens);
    if (opcaoAlternativa && 
        !combinacoesIguais(opcaoAlternativa, opcaoEconomica) && 
        !combinacoesIguais(opcaoAlternativa, opcaoExata)) {
      recomendacoes.push({
        tipo: 'alternativa',
        titulo: 'Opção Alternativa',
        ...opcaoAlternativa
      });
    }
  }

  // Remove duplicatas e ordena por preferência
  return recomendacoes.filter((rec, index, self) =>
    index === self.findIndex(r => combinacoesIguais(r, rec))
  );
}

/**
 * Algoritmo greedy: usa as maiores embalagens possíveis
 */
function calcularOpcaoGreedy(litrosNecessarios, embalagens) {
  const itens = [];
  let restante = litrosNecessarios;

  for (const emb of embalagens) {
    if (emb.litros <= restante || (restante > 0 && emb === embalagens[embalagens.length - 1])) {
      const qtd = Math.floor(restante / emb.litros);
      if (qtd > 0) {
        itens.push({ ...emb, quantidade: qtd });
        restante -= qtd * emb.litros;
      }
    }
  }

  // Se ainda falta, adiciona a menor embalagem que cubra
  if (restante > 0) {
    const menorQueCobre = embalagens
      .filter(e => e.litros >= restante)
      .sort((a, b) => a.litros - b.litros)[0];
    
    if (menorQueCobre) {
      const existente = itens.find(i => i.peso === menorQueCobre.peso);
      if (existente) {
        existente.quantidade++;
      } else {
        itens.push({ ...menorQueCobre, quantidade: 1 });
      }
    } else {
      // Usa a maior disponível
      const maior = embalagens[0];
      const existente = itens.find(i => i.peso === maior.peso);
      if (existente) {
        existente.quantidade++;
      } else {
        itens.push({ ...maior, quantidade: 1 });
      }
    }
  }

  const totalLitros = itens.reduce((sum, item) => sum + (item.litros * item.quantidade), 0);
  
  return {
    itens,
    totalLitros,
    sobra: totalLitros - litrosNecessarios
  };
}

/**
 * Tenta encontrar a combinação com menor sobra
 */
function calcularOpcaoExata(litrosNecessarios, embalagens) {
  let melhorCombo = null;
  let menorSobra = Infinity;

  // Limita a busca para até 10 unidades de cada embalagem
  const maxUnidades = 10;

  function buscar(index, atual, litrosAtuais) {
    if (litrosAtuais >= litrosNecessarios) {
      const sobra = litrosAtuais - litrosNecessarios;
      if (sobra < menorSobra) {
        menorSobra = sobra;
        melhorCombo = atual.filter(item => item.quantidade > 0);
      }
      return;
    }

    if (index >= embalagens.length) return;

    const emb = embalagens[index];
    for (let qtd = 0; qtd <= maxUnidades; qtd++) {
      const novoTotal = litrosAtuais + (qtd * emb.litros);
      if (novoTotal > litrosNecessarios * 2) break; // Evita excesso muito grande
      
      buscar(
        index + 1,
        [...atual, { ...emb, quantidade: qtd }],
        novoTotal
      );
    }
  }

  buscar(0, [], 0);

  if (melhorCombo) {
    const itens = melhorCombo.filter(i => i.quantidade > 0);
    const totalLitros = itens.reduce((sum, item) => sum + (item.litros * item.quantidade), 0);
    return {
      itens,
      totalLitros,
      sobra: menorSobra
    };
  }

  return null;
}

/**
 * Calcula opção alternativa usando embalagens médias
 */
function calcularOpcaoAlternativa(litrosNecessarios, embalagens) {
  // Usa embalagens médias (não a maior nem a menor)
  const sortedByLitros = [...embalagens].sort((a, b) => a.litros - b.litros);
  
  if (sortedByLitros.length <= 2) return null;

  const embMedio = sortedByLitros[Math.floor(sortedByLitros.length / 2)];
  const qtd = Math.ceil(litrosNecessarios / embMedio.litros);
  const totalLitros = qtd * embMedio.litros;

  return {
    itens: [{ ...embMedio, quantidade: qtd }],
    totalLitros,
    sobra: totalLitros - litrosNecessarios
  };
}

/**
 * Verifica se duas combinações são iguais
 */
function combinacoesIguais(a, b) {
  if (!a || !b) return false;
  if (a.itens.length !== b.itens.length) return false;
  
  const sortedA = [...a.itens].sort((x, y) => x.peso - y.peso);
  const sortedB = [...b.itens].sort((x, y) => x.peso - y.peso);
  
  return sortedA.every((item, index) => 
    item.peso === sortedB[index].peso && 
    item.quantidade === sortedB[index].quantidade
  );
}

// ==========================================
// INTERFACE DO USUÁRIO
// ==========================================

let currentStep = 1;

function inicializarCalculadora() {
  // Event listeners para tipo de vaso
  document.querySelectorAll('.pot-type-btn').forEach(btn => {
    btn.addEventListener('click', () => selecionarTipoVaso(btn.dataset.type));
    // Garantir que cliques em elementos internos também funcionem
    btn.querySelectorAll('*').forEach(child => {
      child.addEventListener('click', (e) => {
        e.stopPropagation();
        selecionarTipoVaso(btn.dataset.type);
      });
    });
  });

  // Event listeners para tipo de produto
  document.querySelectorAll('.product-type-btn').forEach(btn => {
    btn.addEventListener('click', () => selecionarTipoProduto(btn.dataset.product));
    // Garantir que cliques em elementos internos também funcionem
    btn.querySelectorAll('*').forEach(child => {
      child.addEventListener('click', (e) => {
        e.stopPropagation();
        selecionarTipoProduto(btn.dataset.product);
      });
    });
  });

  // Event listeners para preenchimento
  document.querySelectorAll('.preenchimento-btn').forEach(btn => {
    btn.addEventListener('click', () => selecionarPreenchimento(btn));
  });

  // Event listener para botão de continuar
  document.getElementById('btn-to-step-3').addEventListener('click', validarEContinuar);

  // Event listeners para botões de voltar
  document.getElementById('btn-back-to-1').addEventListener('click', () => irParaStep(1));
  document.getElementById('btn-back-to-2').addEventListener('click', () => irParaStep(2));

  // Event listeners para inputs (validação em tempo real)
  document.querySelectorAll('.medidas-form input').forEach(input => {
    input.addEventListener('input', validarMedidas);
  });

  document.getElementById('quantidade-vasos').addEventListener('input', (e) => {
    estado.quantidadeVasos = parseInt(e.target.value) || 1;
    validarMedidas();
  });

  // Event listener para recalcular
  document.getElementById('btn-recalcular').addEventListener('click', resetarCalculadora);
}

function selecionarTipoVaso(tipo) {
  estado.tipoVaso = tipo;

  // Atualiza visual dos botões
  document.querySelectorAll('.pot-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === tipo);
  });

  // Mostra formulário de medidas correspondente
  document.querySelectorAll('.medidas-form').forEach(form => form.style.display = 'none');
  document.getElementById(`medidas-${tipo}`).style.display = 'block';
  document.querySelector('.medidas-comum').style.display = 'block';

  // Avança para step 2
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
      if (valido) {
        estado.medidas = { diametro, altura: alturaR };
      }
      break;

    case 'retangular':
      const comprimento = parseFloat(document.getElementById('comprimento').value);
      const largura = parseFloat(document.getElementById('largura').value);
      const alturaRet = parseFloat(document.getElementById('altura-retangular').value);
      valido = comprimento > 0 && largura > 0 && alturaRet > 0;
      if (valido) {
        estado.medidas = { comprimento, largura, altura: alturaRet };
      }
      break;

    case 'afunilado':
      const dSuperior = parseFloat(document.getElementById('diametro-superior').value);
      const dInferior = parseFloat(document.getElementById('diametro-inferior').value);
      const alturaA = parseFloat(document.getElementById('altura-afunilado').value);
      valido = dSuperior > 0 && dInferior > 0 && alturaA > 0;
      if (valido) {
        estado.medidas = { diametroSuperior: dSuperior, diametroInferior: dInferior, altura: alturaA };
      }
      break;
  }

  document.getElementById('btn-to-step-3').disabled = !valido;
  return valido;
}

function validarEContinuar() {
  if (validarMedidas()) {
    irParaStep(3);
  }
}

function selecionarTipoProduto(tipo) {
  estado.tipoProduto = tipo;

  // Atualiza visual dos botões
  document.querySelectorAll('.product-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.product === tipo);
  });

  // Calcula e mostra resultado
  calcularResultado();
  irParaStep(4);
}

function calcularResultado() {
  // Calcula litros necessários
  estado.litrosNecessarios = calcularVolumeTotal();
  const pesoEstimado = estimarPeso(estado.litrosNecessarios);

  // Atualiza resumo
  document.getElementById('resultado-litros').textContent = `${estado.litrosNecessarios.toFixed(1)} L`;
  document.getElementById('resultado-peso').textContent = `${pesoEstimado.toFixed(1)} kg`;

  // Busca produto e recomendações
  const produto = PRODUTOS[estado.tipoProduto];
  const recomendacoes = encontrarRecomendacoes(estado.litrosNecessarios, produto);

  // Mostra recomendação principal
  if (recomendacoes.length > 0) {
    const principal = recomendacoes[0];
    mostrarProdutoPrincipal(produto, principal);

    // Mostra alternativas
    if (recomendacoes.length > 1) {
      mostrarAlternativas(recomendacoes.slice(1));
    } else {
      document.getElementById('alternativas-container').style.display = 'none';
    }
  }

  // Configura botão de WhatsApp
  configurarWhatsApp(produto, recomendacoes[0]);
}

function mostrarProdutoPrincipal(produto, recomendacao) {
  document.getElementById('produto-img').src = produto.imagem;
  document.getElementById('produto-img').alt = produto.nome;
  
  // Monta texto da recomendação
  const textoItens = recomendacao.itens
    .map(item => `${item.quantidade}x ${item.nome}`)
    .join(' + ');
  
  document.getElementById('produto-nome').textContent = textoItens;
  document.getElementById('produto-equiv').textContent = `Total: ${recomendacao.totalLitros.toFixed(1)} L (sobra: ${recomendacao.sobra.toFixed(1)} L)`;
  document.getElementById('produto-qtd').textContent = recomendacao.itens
    .map(item => `${item.quantidade} un de ${item.peso}kg`)
    .join(' + ');
}

function mostrarAlternativas(alternativas) {
  const container = document.getElementById('alternativas-container');
  const lista = document.getElementById('alternativas-lista');
  
  lista.innerHTML = alternativas.map(alt => {
    const textoItens = alt.itens
      .map(item => `${item.quantidade}x ${item.nome}`)
      .join(' + ');
    
    return `
      <div class="alternativa-item">
        <div class="alternativa-titulo">${alt.titulo}</div>
        <div class="alternativa-descricao">${textoItens}</div>
        <div class="alternativa-info">Total: ${alt.totalLitros.toFixed(1)} L (sobra: ${alt.sobra.toFixed(1)} L)</div>
      </div>
    `;
  }).join('');

  container.style.display = alternativas.length > 0 ? 'block' : 'none';
}

function configurarWhatsApp(produto, recomendacao) {
  const textoItens = recomendacao.itens
    .map(item => `${item.quantidade} unidade(s) de ${item.nome}`)
    .join(' e ');

  const mensagem = encodeURIComponent(
    `Olá! Fiz a simulação na calculadora e preciso de ${textoItens}. ` +
    `Volume necessário: ${estado.litrosNecessarios.toFixed(1)} L para ${estado.quantidadeVasos} vaso(s).`
  );

  const link = `https://api.whatsapp.com/send?phone=5522997517940&text=${mensagem}`;
  document.getElementById('btn-whatsapp-pedido').href = link;
}

function irParaStep(step) {
  currentStep = step;

  // Atualiza classes dos steps
  document.querySelectorAll('.calc-step').forEach((el, index) => {
    el.classList.toggle('active', index + 1 === step);
  });

  // Atualiza indicadores de progresso
  document.querySelectorAll('.progress-step').forEach(el => {
    const stepNum = el.dataset.step;
    el.classList.toggle('active', parseInt(stepNum) <= step);
    el.classList.toggle('current', parseInt(stepNum) === step);
  });

  // Scroll para o topo do step
  document.querySelector('.calc-step.active').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetarCalculadora() {
  // Reseta estado
  estado.tipoVaso = null;
  estado.medidas = {};
  estado.quantidadeVasos = 1;
  estado.preenchimento = 0.9;
  estado.tipoProduto = null;
  estado.litrosNecessarios = 0;

  // Reseta inputs
  document.querySelectorAll('.medidas-form input').forEach(input => {
    if (input.id === 'quantidade-vasos') {
      input.value = '1';
    } else {
      input.value = '';
    }
  });

  // Reseta botões
  document.querySelectorAll('.pot-type-btn, .product-type-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Reseta preenchimento para 90%
  document.querySelectorAll('.preenchimento-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === '0.9');
  });

  // Esconde formulários de medidas
  document.querySelectorAll('.medidas-form').forEach(form => form.style.display = 'none');
  document.querySelector('.medidas-comum').style.display = 'none';

  // Desabilita botão de continuar
  document.getElementById('btn-to-step-3').disabled = true;

  // Volta para step 1
  irParaStep(1);
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializarCalculadora);
