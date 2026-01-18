// Célula 01: =================================================================================

d3 = require("d3@6")

// Célula 02: [Planetas] ======================================================================

planets = [
  { name: "Mercúrio", color: "#b1b1b1", radius: 3, orbit: 58e6, period: 88, e: 0.2056, i: 7.00, p_arg: 252.25 },
  { name: "Vênus", color: "#e0b55b", radius: 5, orbit: 108e6, period: 225, e: 0.0068, i: 3.39, p_arg: 181.98 },
  { name: "Terra", color: "#4fa3ff", radius: 5, orbit: 150e6, period: 365, e: 0.0167, i: 0.00, p_arg: 102.95 },
  { name: "Marte", color: "#d14f2b", radius: 4, orbit: 228e6, period: 687, e: 0.0934, i: 1.85, p_arg: 336.04 },
  { name: "Júpiter", color: "#c79c5e", radius: 10, orbit: 778e6, period: 4333, e: 0.0484, i: 1.31, p_arg: 14.75 },
  { name: "Saturno", color: "#e3d8a1", radius: 8, orbit: 1427e6, period: 10759, e: 0.0542, i: 2.48, p_arg: 92.59 },
  { name: "Urano", color: "#9be8ff", radius: 7, orbit: 2871e6, period: 30687, e: 0.0472, i: 0.77, p_arg: 170.96 },
  { name: "Netuno", color: "#4978ff", radius: 7, orbit: 4495e6, period: 60190, e: 0.0086, i: 1.77, p_arg: 44.97 }
];

// Célula 03: [Luas] ==========================================================================

moons = [
  // Lua da Terra
  { name: "Lua", planet: "Terra", radius: 2, orbit: 384400, period: 27.3 },

  // Luas de Júpiter
  { name: "Io", planet: "Júpiter", radius: 2, orbit: 421700, period: 1.77 },
  { name: "Europa", planet: "Júpiter", radius: 2, orbit: 671100, period: 3.55 },
  { name: "Ganimedes", planet: "Júpiter", radius: 3, orbit: 1070400, period: 7.15 },
  { name: "Calisto", planet: "Júpiter", radius: 3, orbit: 1882700, period: 16.7 },

  // Lua de Saturno
  { name: "Titã", planet: "Saturno", radius: 3, orbit: 1221870, period: 15.9 }
]

// Célula 04: [Escala das orbitas dos planetas e das luas] ====================================
scaleOrbits = {
  // Usamos um domínio fixo e robusto que cobre todos os planetas (em KM, de Mercúrio a Netuno)
  const minOrbitKM = 5e7; // ~50 milhões km (Mercúrio)
  const maxOrbitKM = 4.5e9; // ~4.5 bilhões km (Netuno)
  
  const planetScale = d3.scaleLog()
    .domain([minOrbitKM, maxOrbitKM])
    .range([30, 300]); // Definimos um range mínimo (30px) para afastar Mercúrio do Sol, e um máximo (300px).

  const moonScale = d3.scaleLog()
    .domain([1e5, 4e6]) // valores típicos da distância das luas
    .range([8, 25]);     // tamanho visual das órbitas

  return { planetScale, moonScale };
}

// Célula 5: [Variáveis de estado da animação] ================================================

// Célula 05.1: [Controle de reprodução (play/pause)] =========================================

mutable isRunning = true;

// Célula 05.2: [Timestamp do início da pausa] ================================================

mutable pauseStart = 0;

// Célula 05.3: [Soma de pausas anteriores] ===================================================

mutable accumulatedPauseTime = 0;

// Célula 06: [Container e dimensões] =========================================================

containerAndDimensions = {
  // === Dimensões e ponto central da cena ===
  const width = 1160;
  const height = 700;
  const center = { x: width/2, y: height/2 };

  return { width, height, center };
}

// Célula 07: [Criação do Container + SVG] ====================================================

// === Container principal ===
makeContainerCell = function(width, height) {
  const container = document.createElement("div");
  container.style.position = "relative";

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#000033") // Adiciona um fundo escuro
    .node()

  container.appendChild(svg);

  return { container, svg: d3.select(svg) };
}

// Célula 08: [Fundo Estrelado] ===============================================================

// === Fundo Estrelado ===
makeStarfield = function(svg, width, height, n = 300) {
  const stars = d3.range(n).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5
  }));

  svg.selectAll("circle.star")
    .data(stars)
    .join("circle")
    .attr("class", "star")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => d.r)
    .attr("fill", "white")
    .attr("opacity", 0.8);

  return { stars, svg }
}

// Célula 09: [Botão Play/Pause] ==============================================================

// === Botão Play/Pause ===
makePlayPauseButton = function(svg, onToggle) {
  const group = svg.append("g")
    .attr("transform", "translate(10, 660)") // Posiciona o botão no canto inferior esquerdo (ajuste conforme necessário)
    .style("cursor", "pointer")
    .on("click", onToggle);

  // Fundo e texto do botão
  group.append("rect")
    .attr("width", 55)
    .attr("height", 25)
    .attr("fill", "#555")
    .attr("rx", 5); // Cantos arredondados

  const text = group.append("text")
    .attr("x", 27.5) // Centro X do retângulo
    .attr("y", 17) // Posição Y do texto (ajustado para centralizar verticalmente)
    .attr("fill", "white")
    .attr("text-anchor", "middle") // Centraliza o texto horizontalmente
    .attr("dominant-baseline", "middle") // Centraliza o texto verticalmente
    .style("font-size", "12px")
    .text("Pause");                            // Texto inicial é "Pause" (pois está rodando)

  return { group, text };
}

// Célula 10: [Menu de Velocidade] ============================================================

// Célula 10.1: [Variável de Velocidade] ======================================================

mutable speed = 1;

// Célula 10.2: [Controles] ===================================================================

// === Menu de Velocidade (Engrenagem + Controles) ===
makeSpeedMenu = function(container, svg) {
  
  // === Menu flutuante (inicialmente oculto) ===
  const speedMenu = document.createElement("div");
  speedMenu.style.position = "absolute";
  speedMenu.style.bottom = "60px"; // Acima dos controles inferiores
  speedMenu.style.left = "10px";
  speedMenu.style.background = "#2a2a2a"; // Estilo painel escuro
  speedMenu.style.padding = "15px";
  speedMenu.style.borderRadius = "8px";
  speedMenu.style.boxShadow = "0 4px 8px rgba(0,0,0,0.5)";
  speedMenu.style.display = "none";
  speedMenu.style.color = "white";
  speedMenu.style.width = "300px";

  // Estrutura interna do menu
  speedMenu.innerHTML = `
    <strong>Velocidade da reprodução</strong>
    <hr style="border-color:#555;">

    <label for="speedSlider">Velocidade:</label>

    <!-- Controles principais -->
    <input type="range" id="speedSlider" min="0.1" max="10" step="0.1" value="${mutable speed}" style="width: 100%;">
    <input type="number" id="speedNumber" min="0.1" max="10" step="0.1" value="${mutable speed}" style="width: 60px;">

    <!-- Atalhos rápidos -->
    <div style="margin-top:10px;">
      Opções fixas:
      <button id="btn-05x">0.5x</button>
      <button id="btn-1x">1x</button>
      <button id="btn-2x">2x</button>
    </div>
  `;

  container.appendChild(speedMenu);

  // === Sincronização dos controles de velocidade ===
  const sliderInput = speedMenu.querySelector("#speedSlider");
  const numberInput = speedMenu.querySelector("#speedNumber");

  // Atualiza velocidade e sincroniza campos
  const updateSpeed = (newSpeed) => {

      // Verifica se o novo valor é um número válido, senão usa 1 como padrão
      const validatedSpeed = isNaN(newSpeed) || newSpeed === 0 ? 1 : newSpeed;
    
      // Altera a variável 'mutable'
      mutable speed = validatedSpeed; 
      sliderInput.value = validatedSpeed;
      numberInput.value = validatedSpeed;
  };

  // Inputs manuais
  sliderInput.addEventListener("input", (e) => updateSpeed(parseFloat(e.target.value)));
  numberInput.addEventListener("input", (e) => updateSpeed(parseFloat(e.target.value)));

  // Botões de velocidade fixa
  speedMenu.querySelector("#btn-05x").addEventListener("click", () => updateSpeed(0.5));
  speedMenu.querySelector("#btn-1x").addEventListener("click", () => updateSpeed(1));
  speedMenu.querySelector("#btn-2x").addEventListener("click", () => updateSpeed(2));

  // === Ícone de configurações (Engrenagem) ===
  const settingsIcon = svg.append("g")
    .attr("transform", "translate(80, 660)") // Posição próxima ao botão Play/Pause
    .style("cursor", "pointer")
    .on("click", (event) => {
      // Evita fechamento imediato do menu
      event.stopPropagation();
      speedMenu.style.display = (speedMenu.style.display === "none") ? "block" : "none";
    });

  // Ícone simples (placeholder visual)
  settingsIcon.append("rect")
    .attr("width", 30)
    .attr("height", 25)
    .attr("fill", "#555")
    .attr("rx", 5);
  settingsIcon.append("text")
    .attr("x", 15)
    .attr("y", 17)
    .attr("fill", "white")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "18px")
    .text("⚙︎");
  
  // Adiciona o listener para fechar o menu ao clicar fora
  document.addEventListener("click", (event) => {
    // Verifica se o clique ocorreu fora do menu E fora do ícone de engrenagem
    if (!speedMenu.contains(event.target) && !settingsIcon.node().contains(event.target)) {
      speedMenu.style.display = "none";
    }
  });

  // Adicione também a linha para evitar a propagação nos inputs
  sliderInput.addEventListener("input", (e) => {
      e.stopPropagation(); // Adicione esta linha
      updateSpeed(parseFloat(e.target.value));
  });
  numberInput.addEventListener("input", (e) => {
      e.stopPropagation(); // Adicione esta linha
      updateSpeed(parseFloat(e.target.value));
  });
}

// Célula 11: [Encapsulamento do Sistema Solar] ===============================================

makeSolarSystem = (svg, planets, moons, scaleOrbits, center, onClickHandler) => {
  // Toda a renderização do sistema solar é movida para dentro de um grupo centralizado, facilitando a gestão das coordenadas relativas.
  const systemGroup = svg.append("g")
    .attr("transform", `translate(${center.x},${center.y})`);

  // === Sol ===
  systemGroup.append("circle")
    .attr("cx", 0)                             // Sol está na origem (0,0) do systemGroup
    .attr("cy", 0)
    .attr("r", 20)
    .attr("fill", "yellow")
    .style("cursor", "pointer")
    // Adiciona o evento de clique aqui para o Sol
    .on("click", (event, d) => onClickHandler(event, {name: "Sol", type: "Sol", radius: 696000, period: 0, orbit: 0}, 'Sol'))
    .append("title")
    .text("Sol");

  // === Órbitas dos planetas (elipses reais usando <ellipse>) ===
  systemGroup.selectAll("ellipse.orbit-sun")
    .data(planets)
    .join("ellipse") // Usando o elemento ellipse do SVG
    .attr("class", "orbit-sun")
    .attr("fill", "none")
    .attr("stroke", "rgba(255,255,255,0.2)")
    .attr("stroke-dasharray", "2,2")
    .attr("rx", d => { // Raio X (semieixo maior 'a')
      return scaleOrbits.planetScale(d.orbit);
    })
    .attr("ry", d => { // Raio Y (semieixo menor 'b')
      const a_scaled = scaleOrbits.planetScale(d.orbit); 
      return a_scaled * Math.sqrt(1 - d.e ** 2);
    })
    .attr("cx", d => { // Centro X da elipse (deslocado para o foco 'c')
        const a_scaled = scaleOrbits.planetScale(d.orbit); 
        const c_scaled = a_scaled * d.e;
        return -c_scaled; // Deslocamos para a esquerda para que o Sol (0,0) fique no foco
    })
    .attr("cy", 0) // Centro Y da elipse
    .attr("transform", d => { // Aplica a rotação da órbita
      // Rotaciona a elipse inteira em torno do Sol (0,0) pelo ângulo do periélio
      return `rotate(${d.p_arg} 0 0)`; 
    });

  // === Agrupamento das luas por planeta ===
  const moonsByPlanet = d3.group(moons, d => d.planet);

  // === Grupos dos planetas ===
  const planetGroups = systemGroup.selectAll("g.planet")
    .data(planets)
    .join("g")
    .attr("class", "planet");

  // === Função que adiciona anéis a um planeta ===
  function addPlanetRings(planetGroup, planetData) {
    
    const hasRings = ["Júpiter", "Saturno", "Urano", "Netuno"].includes(planetData.name);
    if (!hasRings) return; // Se não for um desses, sai da função.

    // Definimos raios internos e externos fictícios para os anéis, a inclinação, número e cor dos anéis
    let innerRadius, outerRadius, inclination, numRings, baseColor;

    switch(planetData.name){
      case "Júpiter":
        // Anéis finos e próximos ao planeta
        innerRadius = planetData.radius + 0.5;
        outerRadius = planetData.radius + 3;
        numRings = 2;
        baseColor = d3.color(planetData.color).darker(1.5);
        inclination = 0; // Júpter tem pouca inclinação visível
        break;
      case "Urano":
        // Anéis distintos e o planeta é inclinado (98 graus!)
        innerRadius = planetData.radius + 1;
        outerRadius = planetData.radius + 6;
        numRings = 3;
        baseColor = d3.color(planetData.color).darker(0.5);
        inclination = 90; // Visto de "lado"
        break;
      case "Netuno":
        // Anéis tênues e fragmentados
        innerRadius = planetData.radius + 0.5;
        outerRadius = planetData.radius + 4;
        numRings = 2;
        baseColor = d3.color(planetData.color).darker(0.5);
        inclination = 28;
        break;
      case "Saturno":
        // Anéis proeminentes
        innerRadius = planetData.radius + 2;
        outerRadius = planetData.radius + 10;
        numRings = 4;
        baseColor = d3.color(planetData.color).darker(0.5);
        inclination = 90; // Para visualização de "lado"
        break;
    }

    // Gera os dados para as múltiplas faixas dos anéis
    const ringsData = d3.range(numRings).map(i => {
      const t = i / (numRings - 1 || 1); // Normaliza o índice entre 0 e 1 e garante divisão por 1 se numRings for 1 ou 2
      return {
        inner: innerRadius + t * (outerRadius - innerRadius),
        outer: innerRadius + (t + 1/numRings) * (outerRadius - innerRadius),
        // Varia a cor e opacidade levemente para dar textura
        color: baseColor.brighter(t * 1.5), 
        opacity: 0.3 + t * 0.5 // Anéis externos mais opacos
      };
    });

    // Cria um grupo para todos os anéis e aplica a inclinação
    const ringsGroup = planetGroup.append("g")
      .attr("class", "planet-rings-group")
      .attr("transform", `rotate(${inclination}, 0, 0)`); // Aplica a inclinação correta

    ringsGroup.selectAll("path.planet-ring-segment")
      .data(ringsData)
      .join("path")
      .attr("class", "planet-ring-segment")
      .attr("d", d => {
        // Gerador de arco para cada segmento
        return d3.arc()
          .innerRadius(d.inner)
          .outerRadius(d.outer)
          .startAngle(0)
          .endAngle(2 * Math.PI)();
        })
      .attr("fill", d => d.color)
      .attr("fill-opacity", d => d.opacity);
  }

  // === Órbitas das luas (desenhadas dentro do grupo do planeta) ===
    planetGroups.each(function(planetData){
      
      const planetGroup = d3.select(this);
      
      const planetMoons = moonsByPlanet.get(planetData.name);
      if (!planetMoons) return;

      // Desenha órbita da lua (centrada no planeta, que é a origem do planetGroup)
      planetGroup.selectAll("circle.orbit-moon") // Seleciona dentro do grupo do planeta
        .data(planetMoons)
        .join("circle")
        .attr("class", "orbit-moon")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", d => scaleOrbits.moonScale(d.orbit))
        .attr("fill", "none")
        .attr("stroke", "rgba(255,255,255,0.15)")
        .attr("stroke-dasharray", "1,1");
    });

    // === Renderização dos planetas e luas ===
    planetGroups.each(function(planetData) {
      const planetGroup = d3.select(this);

      // Este grupo interno rotacionará com a inclinação axial, mas a animação orbital 
      // na Célula 16 atuará no grupo PAI (`planetGroup`).
      const planetInnerGroup = planetGroup.append("g").attr("class", "planet-inner-group");

      // Chamamos a função para adicionar anéis a este grupo interno
      addPlanetRings(planetInnerGroup, planetData);

      // Planeta (círculo) desenhado DENTRO do grupo interno
      planetInnerGroup.append("circle")
        .attr("class", "planet-circle")
        .style("cursor", "pointer")
        .attr("r", d => d.radius)
        .attr("fill", d => d.color)
        .attr("stroke", "black")
        .attr("stroke-width", 0.5)
        .attr("cx", 0)
        .attr("cy", 0)
        // Adiciona o evento de clique aqui para os Planetas
        .on("click", (event, d) => onClickHandler(event, d, 'planet'))
        .append("title")
        .text(d => d.name);

      // Luas (se existirem) - também adicionadas ao grupo interno para herdar a inclinação
      const planetMoons = moonsByPlanet.get(planetData.name);

      if (!planetMoons) return;                   // planeta sem luas → ignora

      // Cria grupo para as luas
      const moonGroups = planetInnerGroup.selectAll("g.moon")
        .data(planetMoons)
        .join("g")
        .attr("class", "moon");

      // Desenha a lua (agora na origem local do seu próprio grupo, a translação virá na animação)
      moonGroups.append("circle")
        .attr("r", d => d.radius)
        .attr("fill", "white")
        .attr("cx", 0)
        .attr("cy", 0)
        .style("cursor", "pointer")
        // Adiciona o evento de clique aqui para as Luas
        .on("click", (event, d) => onClickHandler(event, d, 'moon'))
        .append("title")
        .text(d => d.name);
    });

  return { planetGroups, moonsByPlanet, systemGroup };
};

// Célula 12: [Geração dos dados para os asteroides] ==========================================

asteroidBeltData = {
  // Define os raios orbitais de Marte e Júpiter (use os valores dos seus dados)
  const marsOrbitKM = planets.find(p => p.name === "Marte").orbit;
  const jupiterOrbitKM = planets.find(p => p.name === "Júpiter").orbit;

  // Define a faixa de órbita em KM (valores reais)
  const minOrbitKM = marsOrbitKM + 1e7; 
  const maxOrbitKM = jupiterOrbitKM - 1e7; 

  const numAsteroids = 1000;
  const asteroids = d3.range(numAsteroids).map(() => ({
    orbit_km: d3.randomUniform(minOrbitKM, maxOrbitKM)(), // Armazena a distância REAL
    angle: d3.randomUniform(0, 2 * Math.PI)(),
    speed: d3.randomUniform(0.5, 2.0)(),
    radius: d3.randomUniform(0.2, 1.5)()
  }));

  return asteroids;
}

// Célula 13: [Renderização dos asteroides] ===================================================

makeAsteroidBelt = (systemGroup, asteroids) => {
  // Cria um grupo de elementos (g) para cada asteroide.
  // Isso facilita a transformação e animação individual de cada um.
  const asteroidGroups = systemGroup.selectAll("g.asteroid")
    .data(asteroids)
    .join("g")
    .attr("class", "asteroid");

  // Adiciona um círculo para representar cada asteroide dentro de seu grupo.
  asteroidGroups.append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", d => d.radius) // Define o raio do asteroide usando o valor do dado.
    .attr("fill", "gray") // Define a cor cinza para os asteroides.
    .attr("fill-opacity", d3.randomUniform(0.2, 0.7)()); // Define uma opacidade aleatória para variedade visual.

  return asteroidGroups;
}

// Célula 14: [Carregar Elementos Orbitais do GitHub] =========================================

async function fetchStaticOrbits() {
  const url = "https://raw.githubusercontent.com/daviteixeira-dev/Data-Visualization-SolarViz/main/data/planets_static.json";
  return fetch(url).then(r => r.json());
}

// Célula 14.1: [Cache dos Elementos Orbitais] ================================================

mutable staticOrbits = null;

// Célula 15: [Funções Orbitais Auxiliares] ===================================================

auxiliaryOrbitalFunctions = {
  function deg2rad(d) {
    return d * Math.PI / 180;
  }
  
  function solveKepler(M, e, tol = 1e-6) {
    let E = M;
    let delta = 1;
  
    while (Math.abs(delta) > tol) {
      delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= delta;
    }
  
    return E;
  }
  
  function orbitalElementsToXY(el, timeDays = 0) {
    const {
      a_AU,
      eccentricity: e,
      M_deg,
      period_days
    } = el;
  
    const n = 2 * Math.PI / period_days;
    const M = deg2rad(M_deg) + n * timeDays;
    const E = solveKepler(M, e);
  
    const x = a_AU * (Math.cos(E) - e);
    const y = a_AU * Math.sqrt(1 - e * e) * Math.sin(E);
  
    return { x, y };
  }

  return { orbitalElementsToXY };
}

// Célula 15.1: [Tempo atual da animação] =====================================================

mutable currentAnimationTime = 0;

// Célula 16: [Viewof Sistema Solar + Animação] ===============================================

viewof solarSystem = {

  // === Carrega dados STATIC uma vez ===
  if (!mutable staticOrbits) {
    mutable staticOrbits = await fetchStaticOrbits();
  }

  // === Estado da animação ===
  let lastRawElapsed = 0;                   // Armazena o tempo bruto do último frame
  let lastFrameTime = performance.now();    // Rastreamento do tempo entre frames para suavidade

  let liveInterval = null;

  // Variáveis para rastrear o estado da transformação do zoom (usado para fechar suavemente)
  let currentTransform = d3.zoomIdentity;

  // === Container principal ===
  // Passamos a largura do painel para o container (350px)
  const { container, svg } = makeContainerCell(containerAndDimensions.width + 350, containerAndDimensions.height);

  // === Fundo Estrelado ===
  makeStarfield(svg, containerAndDimensions.width, containerAndDimensions.height);

  // === Função para fechar painel e resetar visualização ===
  const closePanelAndResetView = () => {
    mutable selectedObject = null; // Reseta o estado de seleção
    
    // Aplica a transição de volta ao normal (scale 1, no centro original)
    systemGroup.transition()
      .duration(800)
      .attr("transform", `translate(${containerAndDimensions.center.x},${containerAndDimensions.center.y}) scale(1)`);
      
    infoPanel.style.display = "none"; // Esconde o painel visualmente

    // Retoma a animação se estava pausada para o zoom
    if (!mutable isRunning) {
        mutable isRunning = true; 
        buttonText.text("Pause");
        // Ajusta o tempo acumulado para evitar "pulo" na animação quando retomar
        mutable accumulatedPauseTime += lastRawElapsed - mutable pauseStart;
    }
  };

  // === Botão Play/Pause ===
  const {text: buttonText } = makePlayPauseButton(svg, () => {
    // Acessa e altera a variável 'mutable'
    mutable isRunning = !mutable isRunning; // Alterna o estado (Play/Pause)

    if (!mutable isRunning) {
      mutable pauseStart = lastRawElapsed; // Marca início da pausa
      buttonText.text("Play");
    } else {
      // Calcule a duração dessa última pausa e adicione ao total acumulado
      mutable accumulatedPauseTime += lastRawElapsed - mutable pauseStart;
      buttonText.text("Pause");
    }
  });

  // === Menu de Velocidade (Engrenagem + Controles) ===
  makeSpeedMenu(container, svg);

  // === Painel de Informações ===
  // Passamos a função de fechamento para makeInfoPanel
  const infoPanel = makeInfoPanel(container, containerAndDimensions.width, closePanelAndResetView);

  // Função interna para preencher e mostrar o painel
  const updateInfoPanel = (obj) => {
    if(!obj){
      infoPanel.style.display = "none";
      return;
    }

    infoPanel.querySelector("#objectName").textContent = obj.name;

    // === LÓGICA ATUALIZADA PARA O TIPO DE OBJETO ===
    let objectTypeDisplay = 'Desconhecido';
    if (obj.type === 'Sol') {
      objectTypeDisplay = 'Estrela';
    } else if (obj.type === 'planet') {
      objectTypeDisplay = 'Planeta';
    } else if (obj.type === 'moon') {
      objectTypeDisplay = 'Lua';
    }
    infoPanel.querySelector("#objectType").textContent = objectTypeDisplay;
    
    // Adicione mais detalhes ou gráficos aqui futuramente
    infoPanel.querySelector("#objectRadius").textContent = obj.radius;
    infoPanel.querySelector("#objectPeriod").textContent = obj.period;
    infoPanel.querySelector("#objectOrbit").textContent = obj.orbit === 0 ? 'N/A' : obj.orbit;
    
    infoPanel.style.display = "block";
  };

  // === Projeção das escalas ===
  const projectLivePosition = (pos) => {
    // 1. Calcula a distância real (Pitágoras) em KM a partir dos dados da API
    // Ignoramos a inclinação Z e projetamos tudo no plano XY
    const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
  
    // 2. USA A MESMA planetScale da Célula 4 para escalonar a distância real
    const scaledR = scaleOrbits.planetScale(r);

    // 3. Calcula o ângulo real atual (Atan2)
    const angle = Math.atan2(pos.y, pos.x);

    // 4. Retorna a posição projetada para o SVG
    return {
      x: scaledR * Math.cos(angle),
      y: scaledR * Math.sin(angle)
    };
  };

  // Função para calcular a posição X, Y de um objeto baseado no tempo de animação
  const getObjectPosition = (d, currentTime) => {
    // Calcula a posição do objeto relativo ao seu centro orbital (Sol para planetas, Planeta para luas)
    let angle, orbitRadius;

    if(d.type === 'planet' || d.type === 'Sol'){
      angle = (currentTime / (d.period * 100)) * 2 * Math.PI;
      orbitRadius = scaleOrbits.planetScale(d.orbit);
      
      // Garante que o retorno seja (0, 0) se for o Sol
      if(d.type === 'Sol') return {x: 0, y: 0}; 

      return { x: orbitRadius * Math.cos(angle), y: orbitRadius * Math.sin(angle) };
    
    } else if(d.type === 'moon'){
      // Encontra os dados do planeta pai
      const parentPlanet = planets.find(p => p.name === d.planet);
      if(!parentPlanet) return {x: 0, y: 0};

      // 1. Posição do planeta pai (relativo ao Sol)
      const planetAngle = (currentTime / (parentPlanet.period * 100)) * 2 * Math.PI;
      const planetOrbitRadius = scaleOrbits.planetScale(parentPlanet.orbit);
      const planetX = planetOrbitRadius * Math.cos(planetAngle);
      const planetY = planetOrbitRadius * Math.sin(planetAngle);

      // 2. Posição da lua (relativa ao planeta pai)
      const moonAngle = (currentTime / (d.period * 50)) * 2 * Math.PI;
      const moonOrbitRadius = scaleOrbits.moonScale(d.orbit);
      const moonX = moonOrbitRadius * Math.cos(moonAngle);
      const moonY = moonOrbitRadius * Math.sin(moonAngle);

      // Posição final da lua (relativa ao Sol)
      return { x: planetX + moonX, y: planetY + moonY };
    }
    return { x: 0, y: 0 }; // Fallback
  };

  // === Botão de Ativar LIVE ===
  const { statusIndicator } = makeLiveButton(svg, async () => { // <--- Captura o statusIndicator
    mutable isLiveMode = !mutable isLiveMode;

    if (mutable isLiveMode) {
      statusIndicator.attr("fill", "yellow"); // <--- Amarelo: Carregando
      liveStatusText.text("Carregando..."); // <-- Mostra o carregando

      // Buscamos a posição atual imediatamente
      // Passamos o callback para função fetch
      mutable livePositions = await fetchAllLivePositions(status => {
        liveStatusText.text(status); // <-- Atualiza o texto com o resultado
        if (status.includes("Erro")) {
          liveStatusText.attr("fill", "red");
          statusIndicator.attr("fill", "red"); // <--- Vermelho: Erro
        } else {
          liveStatusText.attr("fill", "lightgreen");
          statusIndicator.attr("fill", "green"); // <--- Verde: Ativo
        }
      });

      // Configura a atualização periódica (15s)
      liveInterval = setInterval(async () => {
        liveStatusText.text("Atualizando...");
        statusIndicator.attr("fill", "yellow"); // <--- Amarelo: Atualizando
        
        mutable livePositions = await fetchAllLivePositions(status => {
          liveStatusText.text("LIVE Ativo: " + status.toLowerCase().replace("sucesso!", "dados atualizados."));
          statusIndicator.attr("fill", "green"); // <--- Verde: Ativo
        });
      }, 15000);

    } else {
      // Modo Simulação (desliga o LIVE)
      clearInterval(liveInterval);
      liveInterval = null;
      liveStatusText.text("Simulação Ativa"); // <-- Limpa o status
      liveStatusText.attr("fill", "gray");
      statusIndicator.attr("fill", "red"); // <--- Vermelho: Inativo
    }
  });

  // === Indicador de Status LIVE ===
  const liveStatusText = svg.append("text")
    .attr("x", 220) // Posição X ao lado do botão LIVE
    .attr("y", 673) // Posição Y centralizada com o botão
    .attr("fill", "gray")
    .attr("text-anchor", "start")
    .style("font-size", "12px")
    .text(""); // Texto inicial vazio

  // === Criação do sistema solar ===
  // Passamos a função handleClick simplificada que apenas atualiza a mutable
  const { planetGroups, moonsByPlanet, systemGroup } = makeSolarSystem(
    svg, 
    planets, 
    moons, 
    scaleOrbits, 
    containerAndDimensions.center, 
    (event, d, type) => {
      event.stopPropagation();

      // Pausa a animação imediatamente
      if (mutable isRunning) {
        mutable isRunning = false;
        buttonText.text("Play");
        mutable pauseStart = lastRawElapsed; 
      }
      
      mutable selectedObject = { ...d, type: type };
      // isPanelOpen agora é gerenciado implicitamente pela presença de selectedObject
      // Chamamos a função do painel diretamente aqui no click:
      updateInfoPanel(mutable selectedObject); // Abre o painel

      // --- LÓGICA DO ZOOM ---
      let targetX, targetY;

      if(mutable isLiveMode && mutable livePositions?.[d.name]){
        // Se estiver em LIVE, use a posição REAL (eixo X/Y) e a função de projeção
        const livePos = mutable livePositions[d.name];
        const projectedPos = projectLivePosition(livePos);
        targetX = projectedPos.x;
        targetY = projectedPos.y;
        
      } else if(mutable staticOrbits?.planets?.[d.name]){
        // SE ESTIVER NO MODO ESTÁTICO (GitHub), use a mesma conta Kepler do updatePositions
        const el = mutable staticOrbits.planets[d.name];
        const posAU = auxiliaryOrbitalFunctions.orbitalElementsToXY(el, mutable currentAnimationTime / 100);
        const AU_TO_KM = 149597870;
        const rKM = Math.sqrt((posAU.x * AU_TO_KM)**2 + (posAU.y * AU_TO_KM)**2);
        const angleRad = Math.atan2(posAU.y, posAU.x);
        const pos = calculateXY(rKM, angleRad, scaleOrbits.planetScale);
        targetX = pos.x; targetY = pos.y;
      } else {
        // Fallback para Sol ou simulação básica
        const pos = getObjectPosition(d, mutable currentAnimationTime);
        targetX = pos.x; targetY = pos.y;
      }

      const scale = 5; // Fator de zoom fixo para todos os objetos

      // Aplica a transformação suave manualmente
      // Usamos .attr("transform", ...) e d3.transition para evitar conflitos com d3.zoom API
      systemGroup.transition()
        .duration(1000)
        .attr("transform", 
          `translate(${containerAndDimensions.center.x}, ${containerAndDimensions.center.y}) scale(${scale}) translate(${-targetX}, ${-targetY})`
        );
    }
  );

  // Desabilitar completamente a interação manual (scroll/drag/wheel)
  svg.on(".zoom", null);

  // Chama a função para criar o cinturão de asteroides
  const asteroidGroups = makeAsteroidBelt(systemGroup, asteroidBeltData);

  // === Função auxiliar para converter distância radial para X/Y usando a escala LOG ===
  const calculateXY = (distanceKM, angleRad, scaleFunc) => {
      const scaledR = scaleFunc(distanceKM);
      return {
          x: scaledR * Math.cos(angleRad),
          y: scaledR * Math.sin(angleRad)
      };
  };

  // Função de atualização da posição dos elementos (chamada inicial e no timer)
  const updatePositions = (time) => {
    
    // === Movimento orbital dos planetas ===

    // 1. Definimos a seleção base dos planetas
    const selection = planetGroups;

    // 2. Aplique a transição SE estiver no modo LIVE, senão atualize instantaneamente (simulação padrão)
    const transitionSelection = mutable isLiveMode ? selection.transition().duration(1000) : selection;

    // 3. Aplique a transformação (mesma lógica de cálculo de x, y)
    transitionSelection.attr("transform", d => {

      let x, y;

      // === 1. LIVE (backend) ===
      if(mutable isLiveMode && mutable livePositions?.[d.name]){

        const posKM = mutable livePositions[d.name]; // Posição X/Y em KM

        const rKM = Math.sqrt(posKM.x * posKM.x + posKM.y * posKM.y);

        const angleRad = Math.atan2(posKM.y, posKM.x);
        
        const pos = calculateXY(rKM, angleRad, scaleOrbits.planetScale);
        x = pos.x;
        y = pos.y;

      // === 2. STATIC (GitHub JSON) === 
      } else if(mutable staticOrbits && mutable staticOrbits.planets?.[d.name]){

        // Acessa o objeto do planeta usando a chave correta
        const el = mutable staticOrbits.planets[d.name];
        
        // Calcula posição orbital em AU (Unidades Astronômicas)
        const posAU = auxiliaryOrbitalFunctions.orbitalElementsToXY(
          el,
          mutable currentAnimationTime / 100 // Ajuste o divisor para a velocidade da simulação
        );
    
        // CONVERTE DE AU PARA KM (1 AU = ~149.6 milhões de KM)
        const AU_TO_KM = 149597870;
        const x_km = posAU.x * AU_TO_KM;
        const y_km = posAU.y * AU_TO_KM;

        const rKM = Math.sqrt(x_km * x_km + y_km * y_km);
        const angleRad = Math.atan2(y_km, x_km);
        
        const pos = calculateXY(rKM, angleRad, scaleOrbits.planetScale);
        x = pos.x;
        y = pos.y;

      // === 3. Fallback matemático (se o LIVE falhar) ===
      }else{
        const angleRad = (mutable currentAnimationTime / (d.period * 100)) * 2 * Math.PI;
        const orbitRadiusKM = d.orbit; // Valor em KM do array original
        
        const pos = calculateXY(orbitRadiusKM, angleRad, scaleOrbits.planetScale);
        x = pos.x;
        y = pos.y;
      }

      return `translate(${x}, ${y})`;
      
    });

    // === Movimento orbital das luas (relativo ao planeta) ===
    planetGroups.each(function(planetData) {
      const planetMoons = moonsByPlanet.get(planetData.name);
      if (!planetMoons) return;
      
      d3.select(this).selectAll("g.moon").attr("transform", d => {

        // Identifica o nome do planeta pai (ex: "Terra", "Júpiter")
        const parentPlanetName = d.planet;

        // Verifica se estamos no modo LIVE e se temos os dados da Lua E do Planeta Pai
        if (mutable isLiveMode && mutable livePositions[d.name] && mutable livePositions[parentPlanetName]) {
          
          const liveMoonSun = mutable livePositions[d.name];
          const liveParentSun = mutable livePositions[parentPlanetName];
          
          // 1. Calcular a posição da Lua relativa ao Planeta Pai (em KM)
          const moonRelX = liveMoonSun.x - liveParentSun.x;
          const moonRelY = liveMoonSun.y - liveParentSun.y;

          // 2. Calcular a distância (raio) e o ângulo relativos
          const rKM = Math.sqrt(moonRelX ** 2 + moonRelY ** 2);
          const angle = Math.atan2(moonRelY, moonRelX);
        
          // 3. Usamos a sua escala de luas definida na Célula 4
          const scaledR = scaleOrbits.moonScale(rKM);

          // 4. Transformar em coordenadas X, Y escalonadas
          const x = scaledR * Math.cos(angle);
          const y = scaledR * Math.sin(angle);

          // Aplicar a translação local
          return `translate(${x}, ${y})`;
        }

        // FALLBACK: Simulação matemática para quaisquer luas se o LIVE falhar
        const moonAngle = (time / (d.period * 50)) * 2 * Math.PI;
        const moonOrbitRadius = scaleOrbits.moonScale(d.orbit);
        
        // Rotaciona primeiro em torno do Planeta (origem local), depois translada para a distância orbital.
        return `rotate(${moonAngle * 180 / Math.PI}) translate(${moonOrbitRadius}, 0)`;
      });
    });

    // === Movimento orbital dos asteroides ===
    asteroidGroups.attr("transform", d => {
      
      // Ajuste o multiplicador 0.0005 para aumentar ou diminuir a velocidade geral dos asteroides
      const angleRad = (time * 0.0005 * d.speed) + d.angle;
      const scaledR = scaleOrbits.planetScale(d.orbit_km);
    
      const x = scaledR * Math.cos(angleRad);
      const y = scaledR * Math.sin(angleRad);
      return `translate(${x}, ${y})`;
    });
  }

  // Aplica as posições iniciais imediatamente após a criação dos elementos
  updatePositions(mutable currentAnimationTime);

  // === Lógica principal da animação ===
  const timer = d3.timer(rawElapsed => {
    // Mantém o último tempo bruto para lógica de pausa/play
    lastRawElapsed = rawElapsed;

    // Cálculo do delta entre frames (garante animação suave)
    const currentFrameTime = performance.now();
    const deltaTime = currentFrameTime - lastFrameTime;
    lastFrameTime = currentFrameTime;

    // A animação só ocorre se a simulação estiver rodando E nada estiver selecionado (sem zoom fixo)
    if(!mutable selectedObject && mutable isRunning){
      // Atualiza tempo interno da simulação baseado na velocidade
      mutable currentAnimationTime += deltaTime * mutable speed;
      // Chamamos a função de atualização de posições
      updatePositions(mutable currentAnimationTime);
    }
    // Se estiver pausado, o loop simplesmente não faz nada dentro do 'if', 
    // e o accumulatedPauseTime é ajustado no próximo clique em "Play".
  });

  // Limpeza automática do timer no Observable
  invalidation.then(() => {
    timer.stop();
    if (liveInterval) clearInterval(liveInterval);
  });
  return container;
}

// Célula 16.1: [Estado de Seleção] ===========================================================
// Armazena o objeto selecionado (planeta, lua ou sol). Null se nada estiver selecionado.
mutable selectedObject = null;

// Célula 16.2: [Estado do painel lateral] ====================================================
// Controla a visibilidade do painel lateral.
mutable isPanelOpen = false;

// Célula 17: [Painel de Informações Lateral] =================================================

makeInfoPanel = function(container, width, onCloseHandler) {
  
  const infoPanel = document.createElement("div");
  infoPanel.style.position = "absolute";
  infoPanel.style.top = "10px";
  infoPanel.style.right = "0px";
  infoPanel.style.height = "90%";
  infoPanel.style.width = "350px"; // Larga o suficiente para gráficos e informações
  infoPanel.style.background = "#1a1a1a";
  infoPanel.style.padding = "20px";
  infoPanel.style.color = "white";
  infoPanel.style.boxShadow = "-4px 0 8px rgba(0,0,0,0.5)";
  infoPanel.style.display = "none"; // Oculto por padrão
  infoPanel.style.overflowY = "auto";
  infoPanel.style.transition = "right 0.5s ease-in-out"; // Transição suave

  // Estrutura interna inicial (será preenchida dinamicamente)
  infoPanel.innerHTML = `
    <button id="closePanelBtn" style="float: right; background: #555; border: none; color: white; cursor: pointer; padding: 5px 10px;">✕ Fechar</button>
    <h2 id="objectName">Nome do Objeto</h2>
    <hr style="border-color:#555;">
    <div id="objectDetails">
      <!-- Detalhes e gráficos virão aqui -->
      <p><strong>Tipo:</strong> <span id="objectType"></span></p>
      <p><strong>Raio:</strong> <span id="objectRadius"></span> km</p>
      <p><strong>Período Orbital:</strong> <span id="objectPeriod"></span> dias</p>
      <p><strong>Distância do Sol:</strong> <span id="objectOrbit"></span> km</p>
    </div>
    <div id="chartArea" style="margin-top: 20px;">
        <!-- Área para gráficos D3 futuros -->
    </div>
  `;

  container.appendChild(infoPanel);

  // Adiciona o listener para fechar o painel, usando o novo handler passado
  infoPanel.querySelector("#closePanelBtn").addEventListener("click", onCloseHandler);

  return infoPanel;
}

// Célula 18: [Estado global do modo LIVE] ====================================================

// Célula 18.1: [Modo de operação] ============================================================
mutable isLiveMode = false;

// Célula 18.2: [Cache local das posições LIVE] ===============================================
mutable livePositions = {};

// Célula 19: [Fetch LIVE para TODOS os corpos] ===============================================

async function fetchAllLivePositions(setStatus = () => {}) {

  setStatus("Carregando..."); // Define o status inicial 
  
  const bodies = [
    "Mercury","Venus","Earth","Mars",
    "Jupiter","Saturn","Uranus","Neptune",
    "Moon", "Io", "Europa", "Ganymede",
    "Callisto", "Titan"
  ];

  const requests = bodies.map(p =>
    fetch(`https://data-visualization-solar-viz.vercel.app/api/live?body=${p}`)
      .then(r => r.json())
      .then(j => ({ name: p, data: j }))
      .catch(() => null)
  );

  const results = await Promise.all(requests);

  const positions = {};

  const nameMap = {
    "Mercury": "Mercúrio", "Venus": "Vênus", "Earth": "Terra", "Mars": "Marte",
    "Jupiter": "Júpiter", "Saturn": "Saturno", "Uranus": "Urano", "Neptune": "Netuno",
    "Moon": "Lua", "Io": "Io", "Europa": "Europa", "Ganymede": "Ganimedes", "Callisto": "Calisto",
    "Titan": "Titã"
  };
  
  for (const r of results) {
    if (!r || !r.data?.position) continue;
    const ptName = nameMap[r.name]; // Converte para o nome usado no array bodies

    // Projeção simples heliocêntrica 2D
    positions[ptName] = {
      x: r.data.position.x_km,
      y: r.data.position.y_km
    };
  }

  // Verificação de sucesso para o status
  const fetchedCount = Object.keys(positions).length;
  if (fetchedCount === bodies.length) {
      setStatus("Sucesso!");
  } else {
      setStatus(`Erro: ${fetchedCount} corpos carregados.`);
  }

  return positions;
}

// Célula 20: [Botão LIVE] ===================================================================

makeLiveButton = function(svg, onToggle){
  const g = svg.append("g")
    .attr("transform","translate(150,660)")
    .style("cursor","pointer")
    .on("click", onToggle);

  // Fundo do botão (agora neutro, a cor do status é o indicador)
  g.append("rect")
    .attr("width", 60)
    .attr("height", 25)
    .attr("fill", "#333") // Cor de fundo escura
    .attr("rx", 5);

  // Texto "LIVE"
  const text = g.append("text")
    .attr("x", 27)
    .attr("y", 17)
    .attr("fill", "white")
    .attr("text-anchor","middle")
    .text("LIVE");

  // === NOVO: Círculo de Status (Inicialmente Vermelho - Inativo) ===
  const statusIndicator = g.append("circle")
    .attr("cx", 55) // Posição à direita do texto
    .attr("cy", 7)  // Posição superior
    .attr("r", 4)   // Tamanho do círculo
    .attr("fill", "red"); // Cor inicial: Inativo

  // Retornamos a referência ao indicador para uso externo
  return { g, text, statusIndicator };
};