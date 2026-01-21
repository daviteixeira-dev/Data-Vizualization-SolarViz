// Célula 01: [Importação do D3] ==============================================================

d3 = require("d3@6")

// Célula 02: [Planetas] ======================================================================

// Array de objetos contendo os dados fundamentais dos planetas para a simulação
planets = [
  { 
    name: "Mercúrio", 
    color: "#b1b1b1",         // Cor representativa para a visualização
    radius: 3,                // Raio estilizado para a representação gráfica
    realRadius: 2439,         // Raio real em km (usado em cálculos de escala)
    orbit: 58e6,              // Semi-eixo maior em km
    a_AU: 0.387,              // Semi-eixo maior em Unidades Astronômicas (UA)
    period: 88,               // Período orbital em dias terrestres
    mass: 0.330,              // Massa (10^24 kg)
    img: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Mercury_in_true_color.jpg", 
    e: 0.2056,                // Excentricidade da órbita (forma da elipse)
    i: 7.00,                  // Inclinação orbital em graus em relação à eclíptica
    p_arg: 252.25             // Longitude do periastro (ajusta a orientação da órbita)
  },
  // ... (os demais planetas seguem a mesma estrutura de parâmetros orbitais Keplerianos)
  { name: "Vênus", color: "#e0b55b", radius: 5, realRadius: 6051, orbit: 108e6, a_AU: 0.723, period: 225, mass: 4.87, img: "https://upload.wikimedia.org/wikipedia/commons/0/08/Venus_from_Mariner_10.jpg", e: 0.0068, i: 3.39, p_arg: 181.98 },
  { name: "Terra", color: "#4fa3ff", radius: 5, realRadius: 6371, orbit: 150e6, a_AU: 1.000, period: 365, mass: 5.97, img: "https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg", e: 0.0167, i: 0.00, p_arg: 102.95 },
  { name: "Marte", color: "#d14f2b", radius: 4, realRadius: 3389, orbit: 228e6, a_AU: 1.524, period: 687, mass: 0.642, img: "https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg", e: 0.0934, i: 1.85, p_arg: 336.04 },
  { name: "Júpiter", color: "#c79c5e", radius: 10, realRadius: 69911, orbit: 778e6, a_AU: 5.203, period: 4333, mass: 1898, img: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg", e: 0.0484, i: 1.31, p_arg: 14.75 }, 
  { name: "Saturno", color: "#e3d8a1", radius: 8, realRadius: 58232, orbit: 1427e6, a_AU: 9.537, period: 10759, mass: 568, img: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg", e: 0.0542, i: 2.48, p_arg: 92.59 },
  { name: "Urano", color: "#9be8ff", radius: 7, realRadius: 25362, orbit: 2871e6, a_AU: 19.191, period: 30687, mass: 86.8, img: "https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg", e: 0.0472, i: 0.77, p_arg: 170.96 },
  { name: "Netuno", color: "#4978ff", radius: 7, realRadius: 24622, orbit: 4495e6, a_AU: 30.069, period: 60190, mass: 102, img: "https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg", e: 0.0086, i: 1.77, p_arg: 44.97 }
];

// Célula 03: [Luas] ==========================================================================

// Array de objetos definindo satélites naturais selecionados para a visualização hierárquica.
moons = [
  // A propriedade 'planet' serve como chave estrangeira para vincular a lua ao seu corpo pai.
  // 'orbit' aqui representa a distância média em relação ao centro do planeta (em km).
  // 'period' é o tempo de translação ao redor do planeta em dias terrestres.
  { 
    name: "Lua", 
    planet: "Terra", 
    radius: 2, 
    realRadius: 1737, 
    orbit: 384400, 
    period: 27.3, 
    img: "https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg" 
  },

  // Luas Galileanas de Júpiter
  { name: "Io", planet: "Júpiter", radius: 2, realRadius: 1821, orbit: 421700, period: 1.77, img: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Io_highest_resolution_true_color.jpg" },
  { name: "Europa", planet: "Júpiter", radius: 2, realRadius: 1560, orbit: 671100, period: 3.55, img: "https://upload.wikimedia.org/wikipedia/commons/5/54/Europa-moon.jpg" },
  { name: "Ganimedes", planet: "Júpiter", radius: 3, realRadius: 2634, orbit: 1070400, period: 7.15, img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Ganymede_-_Perijove_34_Composite.png/330px-Ganymede_-_Perijove_34_Composite.png" },
  { name: "Calisto", planet: "Júpiter", radius: 3, realRadius: 2410, orbit: 1882700, period: 16.7, img: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Callisto.jpg" },

  // Lua de Saturno
  { name: "Titã", planet: "Saturno", radius: 3, realRadius: 2575, orbit: 1221870, period: 15.9, img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Titan_in_true_color.jpg/330px-Titan_in_true_color.jpg" }
]

// Célula 04: [Escala das orbitas dos planetas e das luas] ====================================

// Define as funções de mapeamento matemático para converter distâncias astronômicas reais em pixels.
scaleOrbits = {
  const minOrbitKM = 5e7; // Limite inferior para escala (pericentro de Mercúrio aprox.)
  const maxOrbitKM = 4.5e9; // Limite superior (órbita de Netuno)

  // d3.scaleLog é essencial aqui: as distâncias no sistema solar crescem exponencialmente.
  // O logaritmo permite que Mercúrio e Netuno sejam visíveis na mesma tela sem que 
  // os planetas internos fiquem "espremidos" no centro.
  const planetScale = d3.scaleLog()
    .domain([minOrbitKM, maxOrbitKM])
    .range([30, 300]); // Mapeia km para um raio visual de 30px a 300px no SVG.

  // Escala para as órbitas das luas em relação ao seu planeta pai.
  const moonScale = d3.scaleLog()
    .domain([1e5, 4e6])
    .range([8, 25]);

  return { planetScale, moonScale };
}

// Célula 5: [Variáveis de estado da animação] ================================================

// Controle de fluxo da simulação. 
// No Observable, 'mutable' permite que células externas modifiquem esses valores 
// e outras células reajam a essas mudanças (reatividade).

// Célula 05.1: [Controle de reprodução (play/pause)] =========================================

// Booleano que determina se o tempo da simulação está avançando.
mutable isRunning = true;

// Célula 05.2: [Timestamp do início da pausa] ================================================

// Registra o momento exato em que o usuário clicou em 'Pause'.
mutable pauseStart = 0;

// Célula 05.3: [Soma de pausas anteriores] ===================================================

// Acumula o tempo total que o sistema ficou pausado. 
// Subtraímos este valor do timestamp global para que os planetas não "saltem" 
// de posição ao despausar.
mutable accumulatedPauseTime = 0;

// Célula 06: [Container e dimensões] =========================================================

// Define as propriedades espaciais da cena principal.
containerAndDimensions = {
  const width = 1160; // Largura otimizada para o layout do Observable
  const height = 700; // Altura da área de visualização
  const center = { x: width/2, y: height/2 }; // Ponto (0,0) astronômico (Sol) no centro da tela

  return { width, height, center };
}

// Célula 07: [Criação do Container + SVG] ====================================================

// Função responsável por gerar os elementos de interface (DOM e SVG).
makeContainerCell = function(width, height) {
  // Cria uma div pai para permitir sobreposição de elementos (como tooltips).
  const container = document.createElement("div");
  container.style.position = "relative";

  // Inicializa o elemento SVG onde as órbitas e planetas 2D serão desenhados.
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#000033") // Azul marinho profundo para representar o espaço
    .node()

  container.appendChild(svg);

  // Retorna o container DOM e a seleção D3 do SVG para encadeamento de métodos.
  return { container, svg: d3.select(svg) };
}

// Célula 08: [Fundo Estrelado] ===============================================================

// Gera uma camada estética de estrelas procedurais para aumentar a imersão.
makeStarfield = function(svg, width, height, n = 300) {
  // Cria um array de 300 pontos com coordenadas e tamanhos aleatórios.
  const stars = d3.range(n).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5 // Variação leve no tamanho para simular brilho/distância
  }));

  // Renderiza as estrelas como círculos estáticos no fundo do SVG.
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

// Cria a interface de controle de execução da simulação.
makePlayPauseButton = function(svg, onToggle) {
  // Grupo (g) que agrupa os elementos visuais do botão para facilitar o posicionamento e eventos.
  const group = svg.append("g")
    .attr("transform", "translate(10, 660)") // Posiciona no canto inferior esquerdo
    .style("cursor", "pointer")
    .on("click", onToggle); // Callback que alterna o estado da variável 'isRunning'

  // Desenha o corpo do botão com cantos arredondados.
  group.append("rect")
    .attr("width", 55)
    .attr("height", 25)
    .attr("fill", "#555")
    .attr("rx", 5);

  // Rótulo de texto centralizado no botão.
  const text = group.append("text")
    .attr("x", 27.5)
    .attr("y", 17)
    .attr("fill", "white")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "12px")
    .text("Pause"); // Estado inicial (simulação começando ativa)

  return { group, text };
}

// Célula 10: [Menu de Velocidade] ============================================================

// Célula 10.1: [Variável de Velocidade] ======================================================

// Fator de escala para o tempo. 
// 1 = Tempo real da simulação; >1 = Aceleração temporal; <1 = Câmera lenta.
mutable speed = 1;

// Célula 10.2: [Controles] ===================================================================

// Constrói o painel de configurações de velocidade usando elementos HTML sobrepostos ao SVG.
makeSpeedMenu = function(container, svg) {
  
  // Cria um elemento <div> para o menu flutuante. 
  // Usamos 'absolute' para posicioná-lo sobre o canvas do sistema solar.
  const speedMenu = document.createElement("div");
  speedMenu.style.position = "absolute";
  speedMenu.style.bottom = "60px";
  speedMenu.style.left = "10px";
  speedMenu.style.background = "#2a2a2a";
  speedMenu.style.padding = "15px";
  speedMenu.style.borderRadius = "8px";
  speedMenu.style.boxShadow = "0 4px 8px rgba(0,0,0,0.5)";
  speedMenu.style.display = "none"; // Inicia oculto (toggle via engrenagem)
  speedMenu.style.color = "white";
  speedMenu.style.width = "300px";

  // Define a interface com sliders e inputs numéricos para controle fino.
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

  // Listeners para eventos de input e botões de atalho.
  const sliderInput = speedMenu.querySelector("#speedSlider");
  const numberInput = speedMenu.querySelector("#speedNumber");

  // Função interna para garantir que todos os inputs (slider e número) reflitam o mesmo valor.
  const updateSpeed = (newSpeed) => {
      // Verifica se o novo valor é um número válido, senão usa 1 como padrão
      const validatedSpeed = isNaN(newSpeed) || newSpeed === 0 ? 1 : newSpeed;
      mutable speed = validatedSpeed; // Atualiza a variável reativa do Observable
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

  // Implementação da Engrenagem (SVG) que controla a visibilidade do menu (HTML).
  const settingsIcon = svg.append("g")
    .attr("transform", "translate(80, 660)")
    .style("cursor", "pointer")
    .on("click", (event) => {
      event.stopPropagation(); // Impede que o clique feche o menu imediatamente
      speedMenu.style.display = (speedMenu.style.display === "none") ? "block" : "none";
    });

  // Desenha o ícone de engrenagem unicode.
  settingsIcon.append("rect").attr("width", 30).attr("height", 25).attr("fill", "#555").attr("rx", 5);
  settingsIcon.append("text").attr("x", 15).attr("y", 17).attr("fill", "white").attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "18px")
    .text("⚙︎");
  
  // Lógica de UX: Fecha o menu automaticamente ao clicar em qualquer área vazia da simulação.
  document.addEventListener("click", (event) => {
    if (!speedMenu.contains(event.target) && !settingsIcon.node().contains(event.target)) {
      speedMenu.style.display = "none";
    }
  });

  // StopPropagation nos inputs para evitar interferências com outros eventos do container.
  sliderInput.addEventListener("input", (e) => { e.stopPropagation(); updateSpeed(parseFloat(e.target.value)); });
  numberInput.addEventListener("input", (e) => { e.stopPropagation(); updateSpeed(parseFloat(e.target.value)); });
}

// Célula 11: [Encapsulamento do Sistema Solar] ===============================================

// Função principal de montagem da cena, utilizando o padrão de "fábrica" para criar os elementos.
makeSolarSystem = (svg, planets, moons, scaleOrbits, center, onClickHandler) => {
  
  // Criamos um grupo principal (<g>) e o transladamos para o centro do SVG.
  // Isso define o Sol como a origem (0,0) do nosso sistema de coordenadas.
  const systemGroup = svg.append("g")
    .attr("transform", `translate(${center.x},${center.y})`);

  // === Sol ===
  // Posicionado no centro absoluto. O onClickHandler permite a integração 
  // com os gráficos coordenados (Vega-Lite) ao selecionar o Sol.
  systemGroup.append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 20)
    .attr("fill", "yellow")
    .style("cursor", "pointer")
    .on("click", (event, d) => onClickHandler(event, {name: "Sol", type: "Sol", radius: 696000, period: 0, orbit: 0}, 'Sol'))
    .append("title")
    .text("Sol");

  // === Órbitas dos planetas (Traçados Reais) ===
  // Diferente de círculos perfeitos, usamos caminhos (paths) baseados em 
  // modelos Keplerianos para representar a excentricidade real das órbitas.
  systemGroup.selectAll("path.orbit-sun")
    .data(planets)
    .join("path")
    .attr("class", "orbit-sun")
    .attr("fill", "none")
    .attr("stroke", "rgba(255,255,255,0.2)")
    .attr("stroke-dasharray", "2,2") // Linha pontilhada para fins estéticos
    .attr("d", d => {
      // Gera os pontos da elipse orbital e aplica uma curva Cardinal fechada do D3
      const points = generateOrbitPathPoints(d, auxiliaryOrbitalFunctions, scaleOrbits.planetScale);
      return d3.line().curve(d3.curveCardinalClosed)(points);
    });

  // Agrupamento lógico das luas usando d3.group para otimizar a busca por planeta pai.
  const moonsByPlanet = d3.group(moons, d => d.planet);

  // === Renderização de Planetas e seus Sistemas (Anéis e Luas) ===
  const planetGroups = systemGroup.selectAll("g.planet")
    .data(planets)
    .join("g")
    .attr("class", "planet");

  // Função interna para injetar a geometria dos anéis (exclusiva para gigantes gasosos).
  function addPlanetRings(planetGroup, planetData) {
    const hasRings = ["Júpiter", "Saturno", "Urano", "Netuno"].includes(planetData.name);
    if (!hasRings) return;

    // Lógica de design: Define raios e inclinações específicas para cada planeta.
    // Nota: Urano recebe inclinação de 90° para refletir seu eixo de rotação único.
    let innerRadius, outerRadius, inclination, numRings, baseColor;

    // Lógica de switch para cada gigante
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

    // Cria faixas concêntricas (anéis) usando d3.arc() para simular densidade.
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

    // Cria um grupo para todos os anéis e aplica a inclinação correta
    const ringsGroup = planetGroup.append("g")
      .attr("class", "planet-rings-group")
      .attr("transform", `rotate(${inclination}, 0, 0)`);

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

  // === Grupos Internos e Luas ===
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

      // Criamos um 'planetInnerGroup' para separar a rotação axial do planeta 
      // da sua translação orbital (que será controlada pelo planetGroup pai).
      planetInnerGroup.append("circle")
        .attr("class", "planet-circle")
        .style("cursor", "pointer")
        .attr("r", d => d.radius)
        .attr("fill", d => d.color)
        .attr("stroke", "black")
        .attr("stroke-width", 0.5)
        .attr("cx", 0)
        .attr("cy", 0)
        // Adiciona o evento de clique para os Planetas
        .on("click", (event, d) => onClickHandler(event, d, 'planet'))
        .append("title")
        .text(d => d.name);

      // Renderiza as luas se o planeta possuir satélites no nosso dataset.
      const planetMoons = moonsByPlanet.get(planetData.name);
      if (!planetMoons) return;

      // Cria grupo para as luas
      const moonGroups = planetInnerGroup.selectAll("g.moon")
        .data(planetMoons)
        .join("g")
        .attr("class", "moon");

      // Desenha a lua
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

// Cria um dataset procedural para popular o cinturão de asteroides de forma realista.
asteroidBeltData = {
  // Define os limites do cinturão (entre as órbitas de Marte e Júpiter) em KM.
  const marsOrbitKM = planets.find(p => p.name === "Marte").orbit;
  const jupiterOrbitKM = planets.find(p => p.name === "Júpiter").orbit;

  const minOrbitKM = marsOrbitKM + 1e7; // Começa 10 milhões de km após Marte
  const maxOrbitKM = jupiterOrbitKM - 1e7; // Termina 10 milhões de km antes de Júpiter

  const numAsteroids = 1000;
  // d3.range cria um array de 1000 elementos. Mapeamos para criar objetos de dados.
  const asteroids = d3.range(numAsteroids).map(() => ({
    orbit_km: d3.randomUniform(minOrbitKM, maxOrbitKM)(), // Distribuição uniforme das distâncias
    angle: d3.randomUniform(0, 2 * Math.PI)(),            // Posição angular inicial aleatória
    speed: d3.randomUniform(0.5, 2.0)(),                  // Velocidade de animação procedural (não física)
    radius: d3.randomUniform(0.2, 1.5)()                  // Tamanho visual aleatório
  }));

  return asteroids;
}

// Célula 13: [Renderização dos asteroides] ===================================================

// Renderiza visualmente os asteroides gerados na Célula 12 no grupo principal do sistema.
makeAsteroidBelt = (systemGroup, asteroids) => {
  // Cria um grupo (<g>) para cada asteroide, que será usado posteriormente para aplicar a transformação (translação).
  const asteroidGroups = systemGroup.selectAll("g.asteroid")
    .data(asteroids)
    .join("g")
    .attr("class", "asteroid");

  // Adiciona o elemento visual (círculo) dentro de cada grupo.
  asteroidGroups.append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", d => d.radius)
    .attr("fill", "gray")
    .attr("fill-opacity", d3.randomUniform(0.2, 0.7)()); // Opacidade variável para efeito de profundidade.

  return asteroidGroups;
}

// Célula 14: [Carregar Elementos Orbitais do GitHub] =========================================

// Esta célula garante que os dados orbitais detalhados e atualizados da JPL (via GitHub Actions) 
// estejam disponíveis no ambiente do Observable antes que as funções Keplerianas sejam executadas.
async function fetchStaticOrbits() {
  const url = "https://raw.githubusercontent.com/daviteixeira-dev/Data-Visualization-SolarViz/main/data/planets_static.json";
  return fetch(url).then(r => r.json());
}

// Célula 14.1: [Cache dos Elementos Orbitais] ================================================

// Guarda o resultado do Fetch
mutable staticOrbits = null;

// Célula 15: [Funções Orbitais Auxiliares] ===================================================

// Implementação das funções matemáticas (Modelo Kepleriano simplificado).
auxiliaryOrbitalFunctions = {
  // Helper: Converte graus em radianos (necessário para funções trigonométricas em JS).
  function deg2rad(d) {
    return d * Math.PI / 180;
  }

  // Resolve a Equação de Kepler (M = E - e*sin(E)) iterativamente.
  // Essencial para calcular a Posição Excêntrica (E) a partir da Anomalia Média (M).
  function solveKepler(M, e, tol = 1e-6) {
    let E = M;        // E é a Anomalia Excêntrica. Começamos com uma estimativa inicial (M).
    let delta = 1;    // Diferença para o critério de convergência.

    // Método de Newton-Raphson para encontrar a raiz da equação.
    while (Math.abs(delta) > tol) {
      delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= delta; // Refina a estimativa de E.
    }
    return E;
  }

  // Converte elementos orbitais clássicos e tempo para coordenadas X, Y no plano da órbita.
  function orbitalElementsToXY(el, timeDays = 0) {
    const { a_AU, eccentricity: e, M_deg, period_days } = el;

    // Calcula a velocidade angular média (movimento médio)
    const n = 2 * Math.PI / period_days;
    // Calcula a Anomalia Média (M) no tempo atual.
    const M = deg2rad(M_deg) + n * timeDays;
    // Resolve M para obter a Anomalia Excêntrica (E).
    const E = solveKepler(M, e);

    // Calcula as coordenadas cartesianas (X, Y) no plano da elipse, com o Sol em um dos focos.
    const x = a_AU * (Math.cos(E) - e);
    const y = a_AU * Math.sqrt(1 - e * e) * Math.sin(E);
  
    return { x, y }; // Retorna em Unidades Astronômicas (AU)
  }

  return { orbitalElementsToXY };
}

// Célula 15.1: [Tempo atual da animação] =====================================================

// Variável de estado para rastrear o tempo decorrido da simulação.
mutable currentAnimationTime = 0;

// Célula 16: [Gerar Pontos da Órbita] ========================================================

// Usa as funções da Célula 15 para pré-calcular pontos que desenham o caminho da órbita (path SVG).
function generateOrbitPathPoints(planetData, orbitalFunctions, scaleFunction) {
  // Encontra os elementos orbitais estáticos para o planeta específico
  const el = mutable staticOrbits.planets[planetData.name];
  if (!el) return [];

  const points = [];
  const totalDays = el.period_days;
  const numPoints = 360; // 1 ponto para cada passo na órbita

  for (let i = 0; i < numPoints; i++) {
    const timeInDays = (i / numPoints) * totalDays;

    // Obtém a posição em AU.
    const posAU = orbitalFunctions.orbitalElementsToXY(el, timeInDays);

    // Converte de AU para KM (constante de conversão).
    const AU_TO_KM = 149597870;
    const x_km = posAU.x * AU_TO_KM;
    const y_km = posAU.y * AU_TO_KM;

    // Transforma a posição real (KM) na posição visual (Pixels) usando a escala logarítmica.
    const rKM = Math.sqrt(x_km**2 + y_km**2);
    const angleRad = Math.atan2(y_km, x_km);
    
    // Calcula a posição final em pixels para o SVG
    const x_px = scaleFunction(rKM) * Math.cos(angleRad);
    const y_px = scaleFunction(rKM) * Math.sin(angleRad);

    points.push([x_px, y_px]);
  }

  return points;
}

// Célula 17: [Tela de Planejamento da Missão] ================================================

// Cria a interface do usuário (UI) para o "diferencial do projeto": o planejamento de rotas de trânsito espacial.
makeMissionUI = function(container) {
  // Cria o painel HTML flutuante usando template literals (`html` do Observable).
  const missionDiv = html`<div style="
    position: absolute; top: 10px; left: 10px; background: rgba(17, 17, 17, 0.95);
    padding: 15px; border-radius: 8px; color: white; font-family: sans-serif;
    border: 1px solid #333; z-index: 1000; width: 240px; box-shadow: 0 4px 20px rgba(0,0,0,0.8);
  ">
    <h3 style="margin: 0 0 10px 0; font-size: 11px; color: #00ffcc; letter-spacing: 1px; text-align:center;">🚀 PLANEJADOR DE MISSÃO</h3>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <select id="origin" style="background: #222; color: white; border: 1px solid #444; font-size: 11px;">
        <option value="" disabled selected>Selecione a Origem</option>
        ${planets.map(p => `<option value="${p.name}">${p.name}</option>`)}
      </select>
      <select id="target" style="background: #222; color: white; border: 1px solid #444; font-size: 11px;">
        <option value="" disabled selected>Selecione o Destino</option>
        ${planets.map(p => `<option value="${p.name}">${p.name}</option>`)}
      </select>
      <div style="display: flex; gap: 5px;">
        <button id="btnConfirm" style="flex:2; background: #006644; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer; font-size: 10px; font-weight: bold;">TRAÇAR ROTA</button>
        <button id="btnReset" style="flex:1; background: #442222; color: white; border: none; padding: 5px; border-radius: 3px; cursor: pointer; font-size: 10px;">RESET</button>
      </div>
    </div>
    <div id="missionStats" style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #222; font-size: 11px; color: #aaa; display:none;">
    </div>
  </div>`;

  container.appendChild(missionDiv);

  // === Lógica dos Controladores ===

  // Botão Confirmar: Define a variável 'mutable mission', que acionará a lógica 
  // de cálculo de transferência de Hohmann em células subsequentes.
  missionDiv.querySelector("#btnConfirm").onclick = () => {
    const origin = missionDiv.querySelector("#origin").value;
    const target = missionDiv.querySelector("#target").value;
    if (origin && target && origin !== target) {
      // Esta atualização de mutable causa reatividade em outras partes do notebook.
      mutable mission = { origin, target };
      missionDiv.querySelector("#missionStats").style.display = "block";
    } else {
      alert("Selecione planetas de origem e destino diferentes.");
    }
  };

  // Botão Reset: Limpa a missão atual.
  missionDiv.querySelector("#btnReset").onclick = () => {
    mutable mission = null;
    missionDiv.querySelector("#origin").value = "";
    missionDiv.querySelector("#target").value = "";
    missionDiv.querySelector("#missionStats").style.display = "none";
  };

  return missionDiv;
}

// Célula 18: [Viewof Sistema Solar + Animação] ===============================================

// A célula 'viewof' combina a visualização com um valor reativo no Observable.
viewof solarSystem = {

  transferData; // Dependência reativa: força a atualização se a rota de missão mudar.
  
  mutable livePositions;    // Armazena as coordenadas reais vindas da API para uso em outros gráficos.
  mutable mission;          // Estado da missão ativa (Origem/Destino).

  // === Inicialização de Dados ===
  // Garante que os elementos orbitais da JPL sejam carregados antes de iniciar a cena.
  if (!mutable staticOrbits) {
    mutable staticOrbits = await fetchStaticOrbits();
  }

  // === Controle de Tempo e Performance ===
  let lastRawElapsed = 0;                   // Tempo total decorrido desde o início.
  let lastFrameTime = performance.now();    // Delta time para manter 60 FPS estáveis.
  let liveInterval = null;

  // Gerenciamento de Transformação do D3.zoom para permitir foco em planetas específicos.
  let currentTransform = d3.zoomIdentity;

  // === Instanciação da Interface ===
  // Cria o palco (SVG) e injeta os componentes de UI (Missão, Estrelas, Botões).
  const { container, svg } = makeContainerCell(containerAndDimensions.width + 350, containerAndDimensions.height);

  // === Injeção da UI de Missão ===
  const missionUI = makeMissionUI(container);

  // === Fundo Estrelado ===
  makeStarfield(svg, containerAndDimensions.width, containerAndDimensions.height);

  // === Lógica de Navegação e Câmera ===
  // Função que reseta o zoom e centraliza o sistema solar quando o usuário fecha o painel lateral.
  const closePanelAndResetView = () => {
    mutable selectedObject = null; // Reseta o estado de seleção
    
    // Transição suave para retornar a escala 1:1 no centro original.
    systemGroup.transition()
      .duration(800)
      .attr("transform", `translate(${containerAndDimensions.center.x},${containerAndDimensions.center.y}) scale(1)`);
      
    infoPanel.style.display = "none"; // Esconde o painel visualmente

    // Resiliência de Animação: Se o sistema estava pausado para inspeção, retoma o fluxo do tempo.
    if (!mutable isRunning) {
      mutable isRunning = true; 
      buttonText.text("Pause");
      // Ajusta o tempo acumulado para evitar "pulo" na animação quando retomar
      mutable accumulatedPauseTime += lastRawElapsed - mutable pauseStart;
    }
  };

  // === Gerenciamento de UI e Painéis ===
  
  // === Botão Play/Pause ===
  const {text: buttonText } = makePlayPauseButton(svg, () => {
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

  // === Menu de Velocidade ===
  makeSpeedMenu(container, svg);

  // Cria o Painel Lateral de Informações que conterá os gráficos Vega-Lite.
  const infoPanel = makeInfoPanel(container, containerAndDimensions.width, closePanelAndResetView);

  // === Integração Multivariada (Dashboard) ===
  // Função que atualiza o painel lateral com metadados e gráficos comparativos do planeta clicado.
  const updateInfoPanel = (obj) => {
    if(!obj){
      infoPanel.style.display = "none";
      return;
    }

    // 1. Busca dados técnicos de planetas.
    //const pData = planets.find(p => p.name === obj.name);
    let data;
    if (obj.type === 'Sol') {
      data = { realRadius: 696340, period: 0, orbit: 0, img: "https://static.escolakids.uol.com.br/2025/01/1-sol-visto-do-universo.jpg" };
    } else if (obj.type === 'moon') {
      data = moons.find(m => m.name === obj.name);
    } else {
      data = planets.find(p => p.name === obj.name);
    }

    // 2. Preenchimento de Cabeçalho
    infoPanel.querySelector("#objectName").textContent = obj.name;
    infoPanel.querySelector("#objectType").textContent = obj.type.toUpperCase();
    
    if (data) {
      infoPanel.querySelector("#planetImg").src = data.img;
      infoPanel.querySelector("#objectRadius").innerHTML = `${data.realRadius.toLocaleString()} <small style="color:#555">km</small>`;
      infoPanel.querySelector("#objectPeriod").innerHTML = `${data.period.toLocaleString()} <small style="color:#555">dias</small>`;
      infoPanel.querySelector("#objectOrbit").innerHTML = obj.type === 'Sol' ? "Centro" : `${(data.orbit / 1e6).toFixed(1)} <small style="color:#555">mi km</small>`;
    }

    // 3. Orquestra a criação de 4 gráficos especializados (Bolhas, Barras, Log e Linhas)
    // para fornecer contexto astronômico comparativo.
    const area = infoPanel.querySelector("#chartArea");
    area.innerHTML = ""; // Limpa os gráficos do planeta anterior
  
    if (obj.type === 'planet') {
      const sections = [
        { title: "Comparaçao de Raio (Escala Real)", fn: createComparisonBubbleChart },
        { title: "Distribuição de Massa (Log)", fn: createMassChart },
        { title: "Mapeamento de Distância", fn: createOrbitLineChart },
        { title: "Duração do Ano (Translação)", fn: createHorizontalBarChart }
      ];

      // Renderização dos cards de gráficos
      sections.forEach(s => {
        const card = document.createElement("div");
        card.style.cssText = "background: #111; padding: 15px; border-radius: 8px; border: 1px solid #222;";
        card.innerHTML = `<h4 style="margin:0 0 15px 0; font-size:11px; color:#555; text-transform:uppercase; letter-spacing:1px;">${s.title}</h4>`;
        
        // Passamos o nome do planeta e a largura do painel (ajustada para as margens)
        const chartElement = s.fn(obj.name, 370);
        card.appendChild(chartElement);
        area.appendChild(card);
      });
    } else {
      // Mensagem amigável para Sol e Luas (já que os gráficos comparativos são baseados na lista de planetas)
      area.innerHTML = `<div style="text-align:center; color:#444; margin-top:50px;">
        Informações detalhadas de gráficos disponíveis apenas no comparativo de planetas.
      </div>`;
    }
    
    infoPanel.style.display = "block";
  };

  // === Projeção Matemática de Dados Reais ===
  // Esta função é vital: ela converte coordenadas cartesianas (X, Y) reais do espaço
  // para a posição visual logarítmica no SVG, mantendo a precisão angular.
  const projectLivePosition = (pos) => {
    const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y);   // Distância Euclidiana Real
    const scaledR = scaleOrbits.planetScale(r);           // Mapeamento Logarítmico
    const angle = Math.atan2(pos.y, pos.x);               // Ângulo real preservado

    return {
      x: scaledR * Math.cos(angle),
      y: scaledR * Math.sin(angle)
    };
  };

  // === Motor de Posicionamento Estático ===
  // Calcula a posição teórica de planetas e luas caso os dados da API falhem ou o modo LIVE esteja off.
  const getObjectPosition = (d, currentTime) => {
    // (lógica de hierarquia: lua rotaciona ao redor do planeta, que rotaciona ao redor do sol)
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

  // === Gerenciador de Dados em Tempo Real (NASA JPL Mode) ===
  const { statusIndicator } = makeLiveButton(svg, async () => {
    mutable isLiveMode = !mutable isLiveMode;

    // Adicione uma referência global para as órbitas (se ainda não tiver)
    const orbitPaths = svg.selectAll("path.orbit-sun"); 

    if (mutable isLiveMode) {
      // UX: Esconde órbitas estáticas para focar na posição exata atual.
      orbitPaths.style("display", "none");
      statusIndicator.attr("fill", "yellow"); // Amarelo: Carregando
      liveStatusText.text("Carregando...");

      // Fetch assíncrono das efemérides reais via JPL Horizons.
      mutable livePositions = await fetchAllLivePositions(status => {
        liveStatusText.text(status);
        if (status.includes("Erro")) {
          liveStatusText.attr("fill", "red");
          statusIndicator.attr("fill", "red"); // Vermelho: Erro
        } else {
          liveStatusText.attr("fill", "lightgreen");
          statusIndicator.attr("fill", "green"); // Verde: Ativo
        }
      });

      // Pooling: Atualiza a posição real a cada 15 segundos para manter a precisão.
      liveInterval = setInterval(async () => {
        liveStatusText.text("Atualizando...");
        statusIndicator.attr("fill", "yellow"); // Amarelo: Atualizando
        
        mutable livePositions = await fetchAllLivePositions(status => {
          liveStatusText.text("LIVE Ativo: " + status.toLowerCase().replace("sucesso!", "dados atualizados."));
          statusIndicator.attr("fill", "green"); // Verde: Ativo
        });
      }, 15000);

    } else {
      // Retorna ao modo de simulação matemática.
      orbitPaths.style("display", "block");
      // Modo Simulação (desliga o LIVE)
      clearInterval(liveInterval);
      liveInterval = null;
      liveStatusText.text("Simulação Ativa"); // Limpa o status
      liveStatusText.attr("fill", "gray");
      statusIndicator.attr("fill", "red"); // Vermelho: Inativo
    }
  });

  // === Indicador de Status LIVE ===
  const liveStatusText = svg.append("text")
    .attr("x", 220)
    .attr("y", 673)
    .attr("fill", "gray")
    .attr("text-anchor", "start")
    .style("font-size", "12px")
    .text("");

  const orbitPaths = svg.selectAll("path.orbit-sun");

  // === Inicialização do Scenegraph (Sistema Solar) ===
  const { planetGroups, moonsByPlanet, systemGroup } = makeSolarSystem(
    svg, 
    planets, 
    moons, 
    scaleOrbits, 
    containerAndDimensions.center, 
    (event, d, type) => { // Callback de Clique (Interação)
      event.stopPropagation();

      // Ao selecionar um corpo, pausamos o tempo para permitir o estudo dos gráficos.
      if (mutable isRunning) {
        mutable isRunning = false;
        buttonText.text("Play");
        mutable pauseStart = lastRawElapsed; 
      }
      
      mutable selectedObject = { ...d, type: type };
      updateInfoPanel(mutable selectedObject); // Aciona o Dashboard Vega-Lite

      // --- LÓGICA DE CÂMERA CINEMATOGRÁFICA ---
      // Determina o alvo do zoom baseado no modo ativo (Real ou Simulação).
      let targetX, targetY;

      if (type === 'moon') {
        // 1. Se estivermos em modo LIVE, pegamos a posição REAL da NASA para a Lua
        if (mutable isLiveMode && mutable livePositions?.[d.name]) {
          const livePos = mutable livePositions[d.name];
          const projectedPos = projectLivePosition(livePos);
          targetX = projectedPos.x;
          targetY = projectedPos.y;
        } else {
          // 2. Se for Simulação, calculamos a posição da Lua somada à do Planeta Pai
          const parentPlanet = planets.find(p => p.name === d.planet);
          
          // Posição do Planeta Pai (Usando a mesma lógica do updatePositions)
          let pX, pY;
          if (mutable staticOrbits?.planets?.[parentPlanet.name]) {
            const el = mutable staticOrbits.planets[parentPlanet.name];
            const posAU = auxiliaryOrbitalFunctions.orbitalElementsToXY(el, mutable currentAnimationTime / 100);
            const AU_TO_KM = 149597870;
            const rKM = Math.sqrt((posAU.x * AU_TO_KM)**2 + (posAU.y * AU_TO_KM)**2);
            const angleRad = Math.atan2(posAU.y, posAU.x);
            const pos = calculateXY(rKM, angleRad, scaleOrbits.planetScale);
            pX = pos.x; pY = pos.y;
          } else {
            const pAngle = (mutable currentAnimationTime / (parentPlanet.period * 100)) * 2 * Math.PI;
            const pPos = calculateXY(parentPlanet.orbit, pAngle, scaleOrbits.planetScale);
            pX = pPos.x; pY = pPos.y;
          }
      
          // Posição Relativa da Lua (Simulação)
          const mAngle = (mutable currentAnimationTime / (d.period * 50)) * 2 * Math.PI;
          const mR = scaleOrbits.moonScale(d.orbit);
          const mX = mR * Math.cos(mAngle);
          const mY = mR * Math.sin(mAngle);
      
          // Alvo final é a soma vetorial
          targetX = pX + mX;
          targetY = pY + mY;
        }
      } else if (d.name === 'Sol') {
        targetX = 0; targetY = 0;
      } else if (mutable isLiveMode && mutable livePositions?.[d.name]) {
        const projectedPos = projectLivePosition(mutable livePositions[d.name]);
        targetX = projectedPos.x; targetY = projectedPos.y;
      } else {
        // Lógica para Planetas (Estático/Simulação)
        const pos = getPos(d.name, mutable currentAnimationTime);
        targetX = pos.x; targetY = pos.y;
      }

      // Fator de zoom mais potente para Luas para não vermos apenas um borrão
      const scale = type === 'moon' ? 15 : (type === 'Sol' ? 2 : 5);

      // Aplica uma transição suave de Interpolação Geométrica para focar no objeto.
      // A matemática aqui compensa a escala para manter o planeta centralizado no zoom.
      systemGroup.transition()
        .duration(1000)
        .attr("transform", 
          `translate(${containerAndDimensions.center.x}, ${containerAndDimensions.center.y}) scale(${scale}) translate(${-targetX}, ${-targetY})`
        );
    }
  );

  // Desabilita o zoom padrão do D3 para manter o controle total via código (Storytelling Guiado).
  svg.on(".zoom", null);

  // Chama a função para criar o cinturão de asteroides
  const asteroidGroups = makeAsteroidBelt(systemGroup, asteroidBeltData);

  // === Trajetória de Missão ===
  // Elemento visual (path) que representa a Rota de Transferência de Hohmann 
  // entre os planetas selecionados na UI de Missão.
  const routePath = systemGroup.append("path")
    .attr("class", "hohmann-route")
    .attr("fill", "none")
    .attr("stroke", "#ff4444")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5,5")
    .style("pointer-events", "none");

  // === Utilitários Geométricos ===
  // Converte distâncias lineares (KM) para o sistema de coordenadas SVG (Pixels)
  // aplicando a distorção Logarítmica para fins de visualização de dados.
  const calculateXY = (distanceKM, angleRad, scaleFunc) => {
      const scaledR = scaleFunc(distanceKM);
      return {
          x: scaledR * Math.cos(angleRad),
          y: scaledR * Math.sin(angleRad)
      };
  };

  // === Motor de Busca de Posição (Abstração) ===
  // Função polimórfica que resolve a posição de qualquer corpo celeste 
  // priorizando: 1. Dados LIVE (NASA) -> 2. Dados Estáticos (Kepler/GitHub) -> 3. Fallback (Matemático).
  const getPos = (planetName, time) => {
    const AU_TO_KM = 149597870;

    // (lógica de seleção de fonte de dados baseada no estado 'isLiveMode')
    if (mutable isLiveMode && mutable livePositions?.[planetName]) {
      return projectLivePosition(mutable livePositions[planetName]);
    } else if (mutable staticOrbits?.planets?.[planetName]) {
      const el = mutable staticOrbits.planets[planetName];
      const posAU = auxiliaryOrbitalFunctions.orbitalElementsToXY(el, time / 100);
      const rKM = Math.sqrt((posAU.x * AU_TO_KM)**2 + (posAU.y * AU_TO_KM)**2);
      const angleRad = Math.atan2(posAU.y, posAU.x);
      return calculateXY(rKM, angleRad, scaleOrbits.planetScale);
    } else {
      const p = planets.find(x => x.name === planetName);
      return getObjectPosition(p, time);
    }
  };

  // === Função Principal de Atualização (Frame Update) ===
  // Responsável por calcular e aplicar as novas coordenadas a todos os elementos da cena.
  const updatePositions = (time) => {
    
    // 1. Atualização dos Planetas (Translação em torno do Sol)
    // No modo LIVE, as posições são fixas pela efeméride da JPL.
    // No modo Simulação, as posições seguem o cálculo da Equação de Kepler.
    planetGroups.attr("transform", d => {

      let x, y;

      // === LIVE (backend) ===
      if(mutable isLiveMode && mutable livePositions?.[d.name]){
  
        const posKM = mutable livePositions[d.name]; // Posição X/Y em KM
        const rKM = Math.sqrt(posKM.x * posKM.x + posKM.y * posKM.y);
        const angleRad = Math.atan2(posKM.y, posKM.x);
        const pos = calculateXY(rKM, angleRad, scaleOrbits.planetScale);
        x = pos.x;
        y = pos.y;
  
      // === STATIC (GitHub JSON) === 
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
  
      // === Fallback matemático (se o LIVE falhar) ===
      }else{
        const angleRad = (mutable currentAnimationTime / (d.period * 100)) * 2 * Math.PI;
        const orbitRadiusKM = d.orbit; // Valor em KM do array original
        const pos = calculateXY(orbitRadiusKM, angleRad, scaleOrbits.planetScale);
        x = pos.x;
        y = pos.y;
      }
  
      return `translate(${x}, ${y})`;
      
    });

    // 2. Atualização das Luas (Hierarquia Local)
    // Implementa a transformação relativa: Se o Planeta se move, a Lua o acompanha.
    planetGroups.each(function(planetData) {
      const planetMoons = moonsByPlanet.get(planetData.name);
      if (!planetMoons) return;
      
      d3.select(this).selectAll("g.moon").attr("transform", d => {
        // No modo LIVE, subtraímos o vetor Sol-Lua do vetor Sol-Planeta para obter
        // a posição relativa da Lua em relação ao seu planeta pai.
        if (mutable isLiveMode && mutable livePositions[d.name] && mutable livePositions[d.planet]) {
          
          const liveMoonSun = mutable livePositions[d.name];
          const liveParentSun = mutable livePositions[d.planet];
          
          // 2.1 Calcular a posição da Lua relativa ao Planeta Pai (em KM)
          const moonRelX = liveMoonSun.x - liveParentSun.x;
          const moonRelY = liveMoonSun.y - liveParentSun.y;

          // 2.2 Calcular a distância (raio) e o ângulo relativos
          const rKM = Math.sqrt(moonRelX ** 2 + moonRelY ** 2);
          const angle = Math.atan2(moonRelY, moonRelX);
        
          // 2.3 Usamos a sua escala de luas definida na Célula 4
          const scaledR = scaleOrbits.moonScale(rKM);

          // 2.4 Transformar em coordenadas X, Y escalonadas
          const x = scaledR * Math.cos(angle);
          const y = scaledR * Math.sin(angle);

          // 2.5 Aplicar a translação local
          return `translate(${x}, ${y})`;
        }

        // Fallback: Rotação matemática simples baseada no período sinódico.
        const moonAngle = (time / (d.period * 50)) * 2 * Math.PI;
        const moonOrbitRadius = scaleOrbits.moonScale(d.orbit);
        
        // Rotaciona primeiro em torno do Planeta (origem local), depois translada para a distância orbital.
        return `rotate(${moonAngle * 180 / Math.PI}) translate(${moonOrbitRadius}, 0)`;
      });
    });

    // 3. Movimento do Cinturão de Asteroides
    // Animação procedural baseada na distância orbital (orbit_km).
    // Asteroides mais próximos do Sol movem-se mais rápido (3ª Lei de Kepler simplificada).
    asteroidGroups.attr("transform", d => {
      // Ajuste o multiplicador 0.0005 para aumentar ou diminuir a velocidade geral dos asteroides
      const angleRad = (time * 0.0005 * d.speed) + d.angle;
      const scaledR = scaleOrbits.planetScale(d.orbit_km);
      const x = scaledR * Math.cos(angleRad);
      const y = scaledR * Math.sin(angleRad);
      return `translate(${x}, ${y})`;
    });


    // === LÓGICA DA ROTA DE TRANSFERÊNCIA (HOHMANN) ===
    // Este bloco calcula a trajetória elíptica de menor energia entre dois planetas.
    const currentTransfer = transferData;
    
    // Verifica se transferData existe e se contém os planetas antes de prosseguir
    if (currentTransfer && currentTransfer.p1 && currentTransfer.p2) {
      const { p1, p2, aTrans, e, phaseAngle, r1, r2, transferTime  } = currentTransfer;
      const AU_TO_KM = 149597870;
      
      // Obtém a posição angular atual dos planetas de origem e destino.
      const pos1 = getPos(p1.name, time);
      const pos2 = getPos(p2.name, time);
  
      // 1. Cálculo do Ângulo de Fase: Determina a posição relativa entre os planetas.
      const angle1Rad = Math.atan2(pos1.y, pos1.x);
      const angle2Rad = Math.atan2(pos2.y, pos2.x);
      // Ângulo de fase atual considerando o sentido anti-horário do sistema solar
      let currentPhase = ((angle2Rad - angle1Rad) * (180 / Math.PI) + 360) % 360;
  
      // 2. Detecção de Janela de Lançamento:
      // Compara o ângulo de fase atual com o ângulo teórico ideal para a transferência.
      // A rota muda de cor (Vermelho -> Verde) quando a janela de 5 graus é atingida.
      const isWindowOpen = Math.abs(currentPhase - phaseAngle) < 5 || Math.abs(currentPhase - phaseAngle) > 355; 
      
      routePath.style("display", "block");
      routePath.attr("stroke", isWindowOpen ? "#00ff88" : "#ff4444")
               .attr("opacity", isWindowOpen ? 1 : 0.4);
        
      const direction = r1 > r2 ? -1 : 1; // Ajusta o sentido da órbita (para dentro ou para fora)
      const rotation = Math.atan2(pos1.y, pos1.x);
  
      // 3. Geração da Geometria da Elipse de Transferência:
      // Mapeia a equação polar da elipse para pontos cartesianos projetados na escala log.
      const points = d3.range(0, Math.PI + 0.1, 0.1).map(theta => {
        const angleAdjustment = r1 > r2 ? Math.PI : 0;
        const r_km = (aTrans * (1 - e * e)) / (1 + e * Math.cos(theta + angleAdjustment)) * AU_TO_KM;
        const scaledR = scaleOrbits.planetScale(r_km);
        return [scaledR * Math.cos(direction * theta + rotation), scaledR * Math.sin(direction * theta + rotation)];
      });
  
      routePath.attr("d", d3.line()(points));

      // 4. Interface em Tempo Real (HUD - Heads-Up Display):
      // Atualiza o painel de missão com dados dinâmicos sobre a viagem.
      const statsDiv = document.querySelector("#missionStats");
      if (statsDiv) {
        statsDiv.style.display = "block";
        statsDiv.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Voo estimado:</span> <span style="color:white">${Math.round(transferTime)} dias</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Distância:</span> <span style="color:white">${(aTrans * 149.6).toFixed(1)}M km</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Janela:</span> 
            <span style="color: ${isWindowOpen ? "#00ff88" : "#ff4444"}; font-weight: bold;">
              ${isWindowOpen ? "ABERTA" : "AGUARDANDO"}
            </span>
          </div>
        `;
      }
    } else {
      // Se não houver missão, esconda a rota
      if (routePath) routePath.style("display", "none");
      const statsDiv = document.querySelector("#missionStats");
      if (statsDiv) statsDiv.style.display = "none";
    }
  };

  // === MOTOR DE ANIMAÇÃO (D3.TIMER) ===
  // O d3.timer funciona como um requestAnimationFrame otimizado para o Observable.
  const timer = d3.timer(rawElapsed => {
    // Mantém o último tempo bruto para lógica de pausa/play
    lastRawElapsed = rawElapsed;
    // Cálculo do delta entre frames (garante animação suave)
    const currentFrameTime = performance.now();
    const deltaTime = currentFrameTime - lastFrameTime;
    lastFrameTime = currentFrameTime;

    // Incrementa o tempo da simulação apenas se o sistema não estiver pausado ou em zoom de inspeção.
    if(!mutable selectedObject && mutable isRunning){
      mutable currentAnimationTime += deltaTime * mutable speed;
    }

    // Ciclo de atualização de todos os elementos gráficos.
    updatePositions(mutable currentAnimationTime);
  });

  // Gerenciamento de Memória: Para o timer e intervalos se a célula for destruída ou reavaliada.
  invalidation.then(() => {
    timer.stop();
    if (liveInterval) clearInterval(liveInterval);
  });
  return container;
}

// Célula 18.1: [Estado de Seleção] ===========================================================

// Singleton que gerencia qual corpo celeste está em foco no sistema.
// Atua como gatilho reativo para a abertura do painel de detalhes.
mutable selectedObject = null;

// Célula 18.2: [Estado do painel lateral] ====================================================

// Booleano de controle de visibilidade da interface de dados Vega-Lite.
mutable isPanelOpen = false;

// Célula 19: [Painel de Informações Lateral] =================================================

// Componente de interface responsável por exibir os metadados e gráficos Vega-Lite.
makeInfoPanel = function(container, width, onCloseHandler) {
  
  const infoPanel = document.createElement("div");
  // Estilização via DOM API para garantir que o painel flutue à direita com scroll independente.
  infoPanel.style.position = "absolute";
  infoPanel.style.top = "10px";
  infoPanel.style.right = "0px";
  infoPanel.style.height = "95%";
  infoPanel.style.width = "420px";
  infoPanel.style.background = "#1a1a1a";
  infoPanel.style.padding = "20px";
  infoPanel.style.color = "white";
  infoPanel.style.boxShadow = "-4px 0 8px rgba(0,0,0,0.5)";
  infoPanel.style.display = "none";
  infoPanel.style.overflowY = "auto";
  infoPanel.style.zIndex = "1000";
  infoPanel.style.transition = "right 0.5s ease-in-out";

  // Template HTML: Define a estrutura de cabeçalho, imagem do planeta e grid de detalhes técnicos.
  infoPanel.innerHTML = `
    <button id="closePanelBtn" style="float: right; background: #222; border: 1px solid #444; color: white; cursor: pointer; padding: 8px 15px; border-radius: 4px; font-size:12px;">✕ FECHAR</button>
    
    <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 25px;">
      <img id="planetImg" src="" style="width: 90px; height: 90px; border-radius: 50%; border: 3px solid #333; object-fit: cover; box-shadow: 0 0 15px rgba(255,255,255,0.1);">
      <div>
        <h2 id="objectName" style="margin:0; font-size: 28px; letter-spacing: 1px; text-transform: uppercase;">---</h2>
        <span id="objectType" style="color: #666; font-size: 14px; font-weight: bold; letter-spacing: 1px;">---</span>
      </div>
    </div>

    <div id="objectDetails" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #161616; padding: 20px; border-radius: 12px; border: 1px solid #222; margin-bottom: 30px;">
      <div><strong style="color:#555; font-size: 10px; display:block; margin-bottom:4px;">RAIO EQUATORIAL</strong> <div id="objectRadius" style="font-size:16px;"></div></div>
      <div><strong style="color:#555; font-size: 10px; display:block; margin-bottom:4px;">PERÍODO ORBITAL</strong> <div id="objectPeriod" style="font-size:16px;"></div></div>
      <div style="grid-column: span 2; border-top: 1px solid #222; pt: 10px;"><strong style="color:#555; font-size: 10px; display:block; margin-top:10px; margin-bottom:4px;">DISTÂNCIA DO SOL</strong> <div id="objectOrbit" style="font-size:16px;"></div></div>
    </div>

    <div id="chartArea" style="display: flex; flex-direction: column; gap: 25px;">
        <!-- Gráficos entrarão aqui -->
    </div>
  `;

  container.appendChild(infoPanel);

  // Vincula o evento de fechar, que dispara o reset da câmera no sistema solar.
  infoPanel.querySelector("#closePanelBtn").addEventListener("click", onCloseHandler);
  return infoPanel;
}

// Célula 20: [Estado global do modo LIVE] ====================================================

// Célula 20.1: [Modo de operação] ============================================================

// Controle mestre do modo de operação. 
// false = Simulação Kepleriana; true = Sincronização real com a NASA.
mutable isLiveMode = false;

// Célula 20.2: [Cache local das posições LIVE] ===============================================

// Estrutura de dados que armazena as últimas coordenadas (x, y) recebidas da API.
// Serve como fonte de verdade para a renderização no modo LIVE.
mutable livePositions = {};

// Célula 21: [Fetch LIVE para TODOS os corpos] ===============================================

// Função assíncrona que consome o backend (Vercel) para obter efemérides em tempo real.
async function fetchAllLivePositions(setStatus = () => {}) {

  setStatus("Carregando..."); // Define o status inicial 

  // Lista de corpos suportados
  const bodies = [
    "Mercury","Venus","Earth","Mars",
    "Jupiter","Saturn","Uranus","Neptune",
    "Moon", "Io", "Europa", "Ganymede",
    "Callisto", "Titan"
  ];

  // Executa múltiplas requisições HTTP em paralelo (Promise.all) para otimizar o tempo de carga.
  const requests = bodies.map(p =>
    fetch(`https://data-visualization-solar-viz.vercel.app/api/live?body=${p}`)
      .then(r => r.json())
      .then(j => ({ name: p, data: j }))
      .catch(() => null)
  );

  const results = await Promise.all(requests);
  const positions = {};

  // Mapeamento de nomes: Traduz os termos da API (inglês) para os termos da visualização (português).
  const nameMap = {
    "Mercury": "Mercúrio", "Venus": "Vênus", "Earth": "Terra", "Mars": "Marte",
    "Jupiter": "Júpiter", "Saturn": "Saturno", "Uranus": "Urano", "Neptune": "Netuno",
    "Moon": "Lua", "Io": "Io", "Europa": "Europa", "Ganymede": "Ganimedes", "Callisto": "Calisto",
    "Titan": "Titã"
  };
  
  for (const r of results) {
    if (!r || !r.data?.position) continue;
    const ptName = nameMap[r.name]; // Converte para o nome usado no array bodies

    // Extrai as coordenadas cartesianas heliocêntricas (km) do dia atual.
    positions[ptName] = {
      x: r.data.position.x_km,
      y: r.data.position.y_km
    };
  }

  // Validação de integridade dos dados e feedback visual via setStatus.
  const fetchedCount = Object.keys(positions).length;
  if (fetchedCount === bodies.length) {
      setStatus("Sucesso!");
  } else {
      setStatus(`Erro: ${fetchedCount} corpos carregados.`);
  }

  return positions;
}

// Célula 22: [Botão LIVE] ====================================================================

// Cria o controle visual para alternar entre simulação e dados reais.
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

  // Indicador de Status: Pequeno LED virtual que muda de cor (Vermelho/Amarelo/Verde).
  // Permite ao usuário saber se a conexão com a API está ativa ou se houve falha.
  const statusIndicator = g.append("circle")
    .attr("cx", 55)
    .attr("cy", 7)
    .attr("r", 4)
    .attr("fill", "red"); // Cor inicial: Inativo

  // Retornamos a referência ao indicador para uso externo
  return { g, text, statusIndicator };
};

// Célula 23: [Dashboard Analítico] ===========================================================

// Célula 23.1: [Gráfico de bolhas comparativo] ===============================================

// Componente que gera um gráfico de bolhas linear para comparação de escala física.
createComparisonBubbleChart = (focusPlanetName, containerWidth) => {
  // 1. Configurações Adaptáveis: Garante que o gráfico se ajuste à largura do painel lateral.
  const width = containerWidth || 400;
  const height = 220;
  const margin = { top: 50, right: 30, bottom: 40, left: 30 };

  // 2. Escala de Tamanho (Linear): 
  // Diferente da visualização principal, aqui usamos d3.scaleLinear para que a 
  // área visual dos círculos represente fielmente a proporção real entre os planetas.
  const chartHeight = height - margin.top - margin.bottom;
  const maxRadius = d3.max(planets, d => d.realRadius);
  const sizeScale = d3.scaleLinear()
    .domain([0, maxRadius])
    .range([3, chartHeight / 2]);

  // 3. Escala de Posicionamento (Point Scale):
  // Distribui os planetas uniformemente ao longo do eixo X.
  const xScale = d3.scalePoint()
    .domain(planets.map(d => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.6);

  // 4. Construção do SVG:
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("overflow", "visible")
    .style("display", "block");

  svg.append("line")
    .attr("x1", margin.left - 10)
    .attr("x2", width - margin.right + 10)
    .attr("y1", height - margin.bottom)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "#333")
    .attr("stroke-width", 1);

  // 5. Renderização dos Planetas:
  // Os planetas são desenhados como círculos apoiados em uma linha de base comum.
  const planetGroups = svg.selectAll("g.planet-visual")
    .data(planets)
    .join("g")
    .attr("class", "planet-visual")
    .attr("transform", d => `translate(${xScale(d.name)}, ${height - margin.bottom})`);

  planetGroups.append("circle")
    .attr("class", "planet-circle")
    .attr("r", d => sizeScale(d.realRadius))
    .attr("cy", d => -sizeScale(d.realRadius)) // Garante que a base do círculo toque a linha
    .attr("fill", d => d.name === focusPlanetName ? d.color : "#444") // Destaque para o planeta selecionado
    .attr("fill-opacity", d => d.name === focusPlanetName ? 0.85 : 0.4)
    .attr("stroke", d => d.name === focusPlanetName ? "white" : "#666")
    .attr("stroke-width", d => d.name === focusPlanetName ? 2 : 1)
    .style("transition", "all 0.2s ease"); // Transição suave para o hover

  planetGroups.append("text")
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .attr("fill", d => d.name === focusPlanetName ? "white" : "#888")
    .style("font-size", "11px")
    .style("font-family", "sans-serif")
    .style("font-weight", d => d.name === focusPlanetName ? "600" : "400")
    .text(d => d.name.substring(0, 3).toUpperCase());

  // 6. Camada de Interatividade (Zonas de Captura):
  // Cria retângulos invisíveis (rect) sobre cada planeta para facilitar a interação 
  // do usuário com o mouse (mouseover/mouseout) e exibição de Tooltips.
  const tooltip = d3.select("body").selectAll(".bubble-tooltip").data([null]).join("div")
    .attr("class", "bubble-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "rgba(15,15,15,0.95)")
    .style("color", "white")
    .style("padding", "8px 12px")
    .style("border", "1px solid #444")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", "3000") // Z-index alto para sobrepor o painel lateral
    .style("box-shadow", "0 4px 10px rgba(0,0,0,0.5)");

  const step = (width - margin.left - margin.right) / (planets.length - 1 || 1);

  svg.append("g")
    .selectAll("rect")
    .data(planets)
    .join("rect")
    .attr("x", d => xScale(d.name) - step / 2)
    .attr("y", 0)
    .attr("width", step)
    .attr("height", height)
    .attr("fill", "transparent")
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      const targetGroup = svg.selectAll(".planet-visual").filter(p => p.name === d.name);
      
      targetGroup.select(".planet-circle")
        .attr("stroke-width", 3)
        .attr("stroke", "white")
        .attr("fill-opacity", 1);
        
      targetGroup.select("text").attr("fill", "white");

      tooltip.style("visibility", "visible")
        .html(`<strong>${d.name}</strong><br>Raio: ${d.realRadius.toLocaleString()} km`);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("top", (event.pageY - 45) + "px")
        .style("left", (event.pageX + 15) + "px");
    })
    .on("mouseout", (event, d) => {
      const targetGroup = svg.selectAll(".planet-visual").filter(p => p.name === d.name);
      const isFocus = d.name === focusPlanetName;

      targetGroup.select(".planet-circle")
        .attr("stroke", isFocus ? "white" : "#666")
        .attr("stroke-width", isFocus ? 2 : 1)
        .attr("fill-opacity", isFocus ? 0.85 : 0.4);
        
      targetGroup.select("text").attr("fill", isFocus ? "white" : "#666");

      tooltip.style("visibility", "hidden");
    });

  return svg.node();
}

// Célula 23.2: [Gráfico de massa] ============================================================

// Componente que gera um gráfico de barras logarítmico para comparação de massas planetárias.
createMassChart = (focusPlanetName, containerWidth) => {
  // 1. Configurações de Dimensão: Ajuste dinâmico para o layout lateral.
  const width = containerWidth || 400;
  const height = 220; 
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };

  // 2. Escala Logarítmica (Vital): 
  // A massa de Júpiter é ~5.700 vezes maior que a de Mercúrio. 
  // Em uma escala linear, as barras dos planetas rochosos seriam invisíveis (pixels sub-unidade).
  // A escala logarítmica permite comparar ordens de grandeza na mesma visualização.
  const yScale = d3.scaleLog()
    .domain([0.1, d3.max(planets, d => d.mass)]) // Domínio baseado em 10^24 kg
    .range([height - margin.bottom, margin.top]);

  // Escala Band para distribuição categórica dos nomes no eixo X.
  const xScale = d3.scaleBand()
    .domain(planets.map(d => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.3);

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("overflow", "visible")
    .style("display", "block");

  // 3. Eixos Estilizados:
  // O eixo Y (Log) exibe ticks formatados para refletir a escala de potências.
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).ticks(3, ".1f"))
    .call(g => {
      g.selectAll("text").attr("fill", "#888").style("font-size", "10px");
      g.select(".domain").attr("stroke", "#444");
      g.selectAll("line").attr("stroke", "#222");
    });

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale))
    .call(g => {
      g.selectAll("text").attr("fill", "#bbb").style("font-size", "10px");
      g.select(".domain").attr("stroke", "#444");
    });

  // 4. Renderização das Barras:
  // As barras são coloridas para destacar o planeta selecionado no sistema solar principal.
  const planetGroups = svg.selectAll("g.planet-bar-group")
    .data(planets)
    .join("g")
    .attr("class", "planet-bar-group");

  planetGroups.append("rect")
    .attr("class", "visible-bar")
    .attr("x", d => xScale(d.name))
    .attr("y", d => yScale(d.mass))
    .attr("width", xScale.bandwidth())
    .attr("height", d => height - margin.bottom - yScale(d.mass))
    .attr("fill", d => d.name === focusPlanetName ? d.color : "#808080")
    .attr("fill-opacity", 0.7)
    .attr("stroke", d => d.name === focusPlanetName ? d.color : "none")
    .attr("stroke-width", 1.5)
    .style("transition", "fill 0.2s, stroke 0.2s, fill-opacity 0.2s");

  // 5. Camada de Interação (UX):
  // Implementação de overlays transparentes mais largos que as barras.
  // Isso melhora a Fitts's Law, facilitando o hover em barras muito finas ou pequenas.
  const tooltip = d3.select("body").selectAll(".mass-tooltip").data([null]).join("div")
    .attr("class", "mass-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "rgba(0,0,0,0.95)")
    .style("color", "white")
    .style("padding", "8px 12px")
    .style("border", "1px solid #444")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", "3000");

  planetGroups.append("rect")
    .attr("x", d => xScale(d.name) - (xScale.step() * xScale.paddingInner() / 2))
    .attr("y", margin.top)
    .attr("width", xScale.step())
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "transparent")
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      // Exibe a massa real em escala de 10^24 kg no tooltip.
      tooltip.style("visibility", "visible")
        .html(`<strong>${d.name}</strong><br>Massa: ${d.mass.toLocaleString()} × 10²⁴ kg`);

      // Feedback visual de destaque (stroke white) ao interagir.
      d3.select(event.currentTarget.parentNode).select(".visible-bar")
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("fill-opacity", 1);
    })
    .on("mousemove", (event) => {
      tooltip.style("top", (event.pageY - 45) + "px")
             .style("left", (event.pageX + 15) + "px");
    })
    .on("mouseout", (event, d) => {
      tooltip.style("visibility", "hidden");
      // Retorna ao estado original (com destaque se for o planeta focado).
      const isFocus = d.name === focusPlanetName;
      d3.select(event.currentTarget.parentNode).select(".visible-bar")
        .attr("stroke", isFocus ? d.color : "none")
        .attr("stroke-width", isFocus ? 1.5 : 0)
        .attr("fill-opacity", 0.7);
    });

  return svg.node();
}

// Célula 23.3: [Gráfico de linha orbital] ====================================================

// Gera um gráfico de linha (slope chart) para visualizar a progressão das distâncias orbitais.
createOrbitLineChart = (focusPlanetName, containerWidth) => {
  // 1. Configurações de Dimensão: Adaptadas para o painel de detalhes (Dashboard).
  const width = containerWidth || 400;
  const height = 220; 
  const margin = { top: 30, right: 30, bottom: 40, left: 60 };

  const maxOrbitKM = 4.5e9; // Limite baseado na órbita de Netuno (~4.5 bilhões de km).

  // 2. Escala Linear de Distância:
  // Diferente da simulação principal, aqui a escala linear revela a verdadeira 
  // disparidade de distância entre os planetas internos (amontoados perto do zero) 
  // e os externos (vastamente distribuídos).
  const yScale = d3.scaleLinear()
    .domain([0, maxOrbitKM])
    .range([height - margin.bottom, margin.top]);

  const xScale = d3.scalePoint()
    .domain(planets.map(d => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.5);

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("overflow", "visible")
    .style("display", "block");

  /// 3. Eixos e Grade:
  // Formatação em Bilhões de km (B km) para facilitar a leitura de grandes magnitudes.
  const yTickValues = [0, 1.5e9, 3e9, 4.5e9];
  const yAxis = d3.axisLeft(yScale)
    .tickValues(yTickValues)
    .tickFormat(d => d === 0 ? "0" : (d / 1e9).toFixed(1) + "B km");

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .call(g => {
      g.selectAll("text").attr("fill", "#888").style("font-size", "9px");
      g.selectAll("line").attr("stroke", "#222");
      g.select(".domain").attr("stroke", "#444");
      // Linhas de grade horizontais
      g.selectAll(".tick line")
        .attr("x2", width - margin.left - margin.right)
        .attr("stroke-opacity", 0.1);
    });

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale))
    .call(g => {
      g.selectAll("text").attr("fill", "#bbb").style("font-size", "9px");
      g.select(".domain").attr("stroke", "#444");
    });

  // 4. Linha de Conexão Orbital (Path):
  // O uso de d3.line() aqui serve para enfatizar a tendência de crescimento orbital.
  svg.append("path")
    .datum(planets)
    .attr("fill", "none")
    .attr("stroke", "#333")
    .attr("stroke-width", 2)
    .attr("d", d3.line()
      .x(d => xScale(d.name))
      .y(d => yScale(d.orbit))
    );

  const dots = svg.append("g")
    .selectAll("circle")
    .data(planets)
    .join("circle")
    .attr("class", "visible-dot")
    .attr("cx", d => xScale(d.name))
    .attr("cy", d => yScale(d.orbit))
    .attr("r", 4)
    .attr("fill", d => d.name === focusPlanetName ? d.color : "#444")
    .attr("stroke", d => d.name === focusPlanetName ? d.color : "#666")
    .attr("stroke-width", d => d.name === focusPlanetName ? 2 : 1)
    .attr("fill-opacity", d => d.name === focusPlanetName ? 1 : 0.5);

  // 5. Pontos de Dados e Ênfase no Foco:
  // Adiciona um "halo" ou aro de destaque (stroke-dasharray) ao redor do planeta selecionado.
  const focusData = planets.find(p => p.name === focusPlanetName);
  if (focusData) {
    svg.append("circle")
      .attr("cx", xScale(focusData.name))
      .attr("cy", yScale(focusData.orbit))
      .attr("r", 10)
      .attr("fill", "none")
      .attr("stroke", focusData.color)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "2,2")
      .style("filter", "drop-shadow(0 0 3px " + focusData.color + ")");
  }

  // 6. Camada de Interação:
  // Zonas de captura verticais (rect) facilitam a ativação de tooltips em telas de alta densidade.
  const tooltip = d3.select("body").selectAll(".orbit-tooltip").data([null]).join("div")
    .attr("class", "orbit-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "rgba(0,0,0,0.95)")
    .style("color", "white")
    .style("padding", "8px 12px")
    .style("border", "1px solid #444")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", "3000");

  const step = (width - margin.left - margin.right) / (planets.length - 1 || 1);

  svg.append("g")
    .selectAll("rect")
    .data(planets)
    .join("rect")
    .attr("x", d => xScale(d.name) - step / 2)
    .attr("y", 0)
    .attr("width", step)
    .attr("height", height)
    .attr("fill", "transparent")
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      tooltip.style("visibility", "visible")
        .html(`<strong>${d.name}</strong><br>Distância: ${(d.orbit / 1e6).toFixed(1)} mi km`);

      svg.selectAll(".visible-dot")
        .filter(p => p.name === d.name)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("fill-opacity", 1);
    })
    .on("mousemove", (event) => {
      tooltip.style("top", (event.pageY - 45) + "px")
             .style("left", (event.pageX + 15) + "px");
    })
    .on("mouseout", (event, d) => {
      tooltip.style("visibility", "hidden");
      const isFocus = d.name === focusPlanetName;
      svg.selectAll(".visible-dot")
        .filter(p => p.name === d.name)
        .attr("stroke", isFocus ? d.color : "#666")
        .attr("stroke-width", isFocus ? 2 : 1)
        .attr("fill-opacity", isFocus ? 1 : 0.5);
    });

  return svg.node();
}

// Célula 23.4: [Gráfico de barras horizontais] ===============================================

// Gera um gráfico de barras horizontais para comparar o tempo de translação (ano) de cada planeta.
createHorizontalBarChart = (focusPlanetName, containerWidth) => {
  // 1. Configurações de Dimensão: Altura ligeiramente maior (250px) para acomodar todos os labels no eixo Y.
  const width = containerWidth || 400;
  const height = 250; 
  const margin = { top: 10, right: 50, bottom: 40, left: 80 };

  // 2. Processamento de Dados e Escalas:
  // Ordena os dados pelo período orbital para criar um ranking visual intuitivo.
  const data = [...planets].sort((a, b) => a.period - b.period);

  const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.period)])
    .range([0, width - margin.left - margin.right]);

  // d3.scaleBand para o eixo Y facilita a leitura dos nomes por extenso à esquerda.
  const yScale = d3.scaleBand()
    .domain(data.map(d => d.name))
    .range([height - margin.top - margin.bottom, 0])
    .padding(0.2);

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("display", "block")
    .style("overflow", "visible");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // 3. Eixos Estilizados:
  // Formata os valores do eixo X com 'd' (dias) para contexto imediato da métrica temporal.
  g.append("g")
    .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(4).tickFormat(d => `${d.toLocaleString()}d`))
    .call(g => g.selectAll("text").attr("fill", "#666").style("font-size", "10px"))
    .call(g => g.select(".domain").attr("stroke", "#333"));

  g.append("g")
    .call(d3.axisLeft(yScale))
    .call(g => g.selectAll("text").attr("fill", "#bbb").style("font-size", "10px"))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").remove());

  // 4. Tooltip Dinâmico:
  // Exibe o valor exato em dias terrestres, auxiliando na compreensão das enormes escalas
  // de tempo de Netuno em comparação aos planetas internos.
  const tooltip = d3.select("body").selectAll(".chart-tooltip").data([null]).join("div")
    .attr("class", "chart-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "rgba(0,0,0,0.95)")
    .style("color", "white")
    .style("padding", "8px 12px")
    .style("border", "1px solid #444")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", "3000");

  // 5. Renderização e Interatividade:
  // Implementa "Zonas de Captura" largas (rect transparentes) para melhorar a experiência
  // de interação (Fitts's Law), permitindo o hover em qualquer lugar da linha do planeta.
  const interactionGroups = g.selectAll(".interact-group")
    .data(data)
    .join("g")
    .attr("class", "interact-group");

  // Barras Visíveis
  interactionGroups.append("rect")
    .attr("class", "visible-bar")
    .attr("x", 0)
    .attr("y", d => yScale(d.name))
    .attr("height", yScale.bandwidth())
    .attr("width", d => xScale(d.period))
    .attr("fill", d => d.name === focusPlanetName ? d.color : "#333") // Destaque por cor
    .attr("fill-opacity", d => d.name === focusPlanetName ? 1 : 0.6)
    .style("transition", "fill 0.2s, stroke 0.2s");

  // Retângulos de Captura (Invisíveis e largos para facilitar o hover)
  interactionGroups.append("rect")
    .attr("x", 0)
    .attr("y", d => yScale(d.name))
    .attr("width", width - margin.left - margin.right)
    .attr("height", yScale.bandwidth())
    .attr("fill", "transparent")
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      const isFocus = d.name === focusPlanetName;
      
      d3.select(event.currentTarget.parentNode).select(".visible-bar")
        .attr("fill", isFocus ? d.color : "#666")
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .attr("fill-opacity", 1);

      tooltip.style("visibility", "visible")
        .html(`<strong>${d.name}</strong><br>Translação: ${d.period.toLocaleString()} dias`);
    })
    .on("mousemove", (event) => {
      tooltip.style("top", (event.pageY - 45) + "px")
             .style("left", (event.pageX + 15) + "px");
    })
    .on("mouseout", (event, d) => {
      const isFocus = d.name === focusPlanetName;
      
      d3.select(event.currentTarget.parentNode).select(".visible-bar")
        .attr("fill", isFocus ? d.color : "#333")
        .attr("stroke", "none")
        .attr("fill-opacity", isFocus ? 1 : 0.6);

      tooltip.style("visibility", "hidden");
    });

  return svg.node();
}

// Célula 25: [Mission Planner] ===============================================================

// Célula 25.1: [Física Orbital] ==============================================================

// Este objeto encapsula a física por trás das trajetórias interplanetárias.
orbitalPhysics = {
  // Constante Gravitacional do Sol (μ) em unidades astronômicas e dias.
  const muSun = 0.000295912208; // AU³/dia²

  // Implementa a Manobra de Transferência de Hohmann: a rota de menor energia (Delta-V) 
  // para transitar entre duas órbitas circulares coplanares.
  function calculateHohmann(r1, r2) {
    const aTrans = (r1 + r2) / 2; // Semi-eixo maior da elipse de transferência
    
    // Cálculo de velocidades orbitais e impulsos necessários (Delta-V)
    const v1 = Math.sqrt(muSun / r1);
    const v2 = Math.sqrt(muSun / r2);
    const vTrans1 = Math.sqrt(muSun * (2 / r1 - 1 / aTrans));
    const vTrans2 = Math.sqrt(muSun * (2 / r2 - 1 / aTrans));
    
    const deltaV1 = Math.abs(vTrans1 - v1); // Queima na partida
    const deltaV2 = Math.abs(v2 - vTrans2);

    // Tempo de voo: metade do período orbital da elipse de transferência (Leis de Kepler)
    const transferTime = Math.PI * Math.sqrt(Math.pow(aTrans, 3) / muSun);
    
    // Ângulo de Fase Ideal: Posição relativa em que o alvo deve estar no momento do lançamento.
    const omega2 = Math.sqrt(muSun / Math.pow(r2, 3));
    const phaseAngle = (180 - omega2 * transferTime * (180 / Math.PI)) % 360;

    return { deltaV1, deltaV2, transferTime, phaseAngle, aTrans, e: Math.abs(r1 - r2) / (r1 + r2) };
  }

  // Estima em quantos dias ocorrerá a próxima janela de lançamento ideal, 
  // baseando-se na velocidade angular relativa entre os dois corpos.
  function getLaunchWindow(currentAngle, idealAngle, r1, r2) {
    const n1 = Math.sqrt(muSun / Math.pow(r1, 3));
    const n2 = Math.sqrt(muSun / Math.pow(r2, 3));
    const relativeVelocity = Math.abs(n1 - n2);
    let diffRad = (idealAngle - currentAngle) * (Math.PI / 180);
    while (diffRad < 0) diffRad += 2 * Math.PI;
    return diffRad / relativeVelocity; // Retorna dias
  }

  return { calculateHohmann, getLaunchWindow };
}

// Célula 25.2: [Estado da Missão] ============================================================

// Variável reativa que armazena a intenção de viagem do usuário (Origem -> Destino).
mutable mission = null;

// Célula 25.3: [Lógica da Rota de Transferência] =============================================

// Processador que transforma a intenção de missão em dados geométricos para o SVG.
transferData = {
  if (!mission) return null;

  const p1 = planets.find(p => p.name === mission.origin);
  const p2 = planets.find(p => p.name === mission.target);
  
  if (!p1 || !p2) return null;

  const r1 = p1.a_AU;
  const r2 = p2.a_AU;
  const aTrans = (r1 + r2) / 2;
  const e = Math.abs(r1 - r2) / (r1 + r2); // Excentricidade da elipse de transferência

  // Cálculo robusto do ângulo de fase ideal (Phase Angle).
  // Determina onde o planeta de destino precisa estar em relação ao de origem 
  // para que a sonda o encontre no periastro/apoastro da elipse.
  const phaseAngle = (180 * (1 - Math.pow(aTrans / r2, 1.5))) % 360;

  // Ajuste de direção: Viagens para fora (Ex: Terra -> Marte) vs para dentro (Ex: Terra -> Vênus).
  const correctedPhaseAngle = r1 < r2 ? (phaseAngle + 360) % 360 : (360 - phaseAngle);

  // Tempo de transferência em dias terrestres.
  const transferTime = 365.25 * 0.5 * Math.pow(aTrans, 1.5);

  return { p1, p2, aTrans, e, phaseAngle: correctedPhaseAngle, r1, r2, transferTime };
}