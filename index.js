// Célula 1: ===================================================================================

d3 = require("d3@6")

// Célula 2: [Planetas] ========================================================================

planets = [
  { name: "Mercúrio", color: "#b1b1b1", radius: 3, orbit: 58e6, period: 88 },
  { name: "Vênus", color: "#e0b55b", radius: 5, orbit: 108e6, period: 225 },
  { name: "Terra", color: "#4fa3ff", radius: 5, orbit: 150e6, period: 365 },
  { name: "Marte", color: "#d14f2b", radius: 4, orbit: 228e6, period: 687 },
  { name: "Júpiter", color: "#c79c5e", radius: 10, orbit: 778e6, period: 4333 },
  { name: "Saturno", color: "#e3d8a1", radius: 8, orbit: 1427e6, period: 10759 },
  { name: "Urano", color: "#9be8ff", radius: 7, orbit: 2871e6, period: 30687 },
  { name: "Netuno", color: "#4978ff", radius: 7, orbit: 4495e6, period: 60190 }
]

// Célula 3: [Luas] ============================================================================

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

// Célula 4: [Escala das orbitas dos planetas e das luas] ======================================
scaleOrbits = {
  const planetScale = d3.scaleLog()
    .domain([d3.min(planets, d => d.orbit), d3.max(planets, d => d.orbit)])
    .range([30, 300]); // Definimos um range mínimo (30px) para afastar Mercúrio do Sol, e um máximo (300px).

  const moonScale = d3.scaleLog()
    .domain([1e5, 4e6]) // valores típicos da distância das luas
    .range([8, 25]);     // tamanho visual das órbitas

  return { planetScale, moonScale };
}

// Célula 5: [Variáveis de estado da animação] =================================================

mutable isRunning = true;                     // Controla reprodução (play/pause)

// Célula 6

mutable pauseStart = 0;                       // Timestamp do início da pausa

// Célula 7

mutable accumulatedPauseTime = 0;             // Soma de pausas anteriores

// Célula 8: [Container e dimensões] ===========================================================

containerAndDimensions = {
  // === Dimensões e ponto central da cena ===
  const width = 1160;
  const height = 700;
  const center = { x: width/2, y: height/2 };

  return { width, height, center };
}

// Célula 9: [Criação do Container + SVG] ======================================================

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

// Célula 10: [Fundo Estrelado] ================================================================

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

// Célula 11: [Botão Play/Pause] ===============================================================

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

// Célula 12: [Menu de Velocidade] =============================================================

// Célula 12.1

mutable speed = 1;

// Célula 12.2

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

// Célula 13: [Encapsulamento do Sistema Solar] ================================================

makeSolarSystem = (svg, planets, moons, scaleOrbits, center) => {
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
    .append("title")
    .text("Sol");

  // === Órbitas dos planetas (estáticas) ===
  systemGroup.selectAll("circle.orbit-sun")
    .data(planets)
    .join("circle")
    .attr("class", "orbit-sun")
    .attr("cx", 0) 
    .attr("cy", 0)
    .attr("r", d => scaleOrbits.planetScale(d.orbit))
    .attr("fill", "none")
    .attr("stroke", "rgba(255,255,255,0.2)")
    .attr("stroke-dasharray", "2,2");

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
        .append("title")
        .text(d => d.name);
    });

  return { planetGroups, moonsByPlanet, systemGroup };
};

// Célula 14: [Geração dos dados para os asteroides] ===========================================

asteroidBeltData = {
  // Define os raios orbitais de Marte e Júpiter (use os valores dos seus dados)
  const marsOrbitRadius = scaleOrbits.planetScale(planets.find(p => p.name === "Marte").orbit);
  const jupiterOrbitRadius = scaleOrbits.planetScale(planets.find(p => p.name === "Júpiter").orbit);

  // Define a faixa de órbita para os asteroides
  const minOrbitRadius = marsOrbitRadius + 20; // Pouco depois de Marte
  const maxOrbitRadius = jupiterOrbitRadius - 20; // Pouco antes de Júpiter
  
  // Gera os asteroides aleatoriamente
  const numAsteroids = 1000;
  const asteroids = d3.range(numAsteroids).map(() => ({
    orbit: d3.randomUniform(minOrbitRadius, maxOrbitRadius)(),
    angle: d3.randomUniform(0, 2 * Math.PI)(),
    speed: d3.randomUniform(0.5, 2.0)(),
    radius: d3.randomUniform(0.2, 1.5)()
  }));

  return asteroids;
}

// Célula 15: [Renderização dos asteroides] ====================================================

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

// Célula 16: [Viewof Sistema Solar + Animação] ================================================

viewof solarSystem = {

  // === Estado da animação ===
  let lastRawElapsed = 0;                   // Armazena o tempo bruto do último frame
  let animationTime = 0;                    // Tempo acumulado (independente do timer do D3)
  let lastFrameTime = performance.now();    // Rastreamento do tempo entre frames para suavidade

  // === Container principal ===
  const { container, svg } = makeContainerCell(containerAndDimensions.width, containerAndDimensions.height);

  // === Fundo Estrelado ===
  makeStarfield(svg, containerAndDimensions.width, containerAndDimensions.height);

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

  // === Criação do sistema solar ===
  const { planetGroups, moonsByPlanet, systemGroup } = makeSolarSystem(svg, planets, moons, scaleOrbits, containerAndDimensions.center);

  // Chama a nova função para criar o cinturão de asteroides
  const asteroidGroups = makeAsteroidBelt(systemGroup, asteroidBeltData);

  // === Lógica principal da animação (com Delta Time) ===
  const timer = d3.timer(rawElapsed => {
    // Mantém o último tempo bruto para lógica de pausa/play
    lastRawElapsed = rawElapsed;

    // Cálculo do delta entre frames (garante animação suave)
    const currentFrameTime = performance.now();
    const deltaTime = currentFrameTime - lastFrameTime;
    lastFrameTime = currentFrameTime;

    if (mutable isRunning) {
      // Atualiza tempo interno da simulação baseado na velocidade
      animationTime += deltaTime * mutable speed;
      
      // === Movimento orbital dos planetas ===
      planetGroups.attr("transform", d => {
        const angle = (animationTime / (d.period * 100)) * 2 * Math.PI;
        const orbitRadius = scaleOrbits.planetScale(d.orbit);
        // Rotaciona primeiro em torno do Sol (origem), depois translada para a distância orbital.
        return `rotate(${angle * 180 / Math.PI}) translate(${orbitRadius}, 0)`;
      });

      // === Movimento orbital das luas (relativo ao planeta) ===
      planetGroups.each(function(planetData) {
        const planetMoons = moonsByPlanet.get(planetData.name);
        if (!planetMoons) return;
      
        const moonGroups = d3.select(this).selectAll("g.moon");
      
        moonGroups.attr("transform", d => {
          const moonAngle = (animationTime / (d.period * 50)) * 2 * Math.PI;
          const moonOrbitRadius = scaleOrbits.moonScale(d.orbit);
          // Rotaciona primeiro em torno do Planeta (origem local), depois translada para a distância orbital.
          return `rotate(${moonAngle * 180 / Math.PI}) translate(${moonOrbitRadius}, 0)`;
        });
      });

      // === Movimento orbital dos asteroides ===
      asteroidGroups.attr("transform", d => {
        // Adiciona um fator multiplicador maior para desacelerar o movimento
        const slowFactor = 50;
        const angle = (animationTime / (d.orbit * d.speed * slowFactor)) * 2 * Math.PI;
        return `rotate(${angle * 180 / Math.PI}) translate(${d.orbit}, 0)`;
      });
    }
    // Se estiver pausado, o loop simplesmente não faz nada dentro do 'if', 
    // e o accumulatedPauseTime é ajustado no próximo clique em "Play".
  });

  // Limpeza automática do timer no Observable
  invalidation.then(() => timer.stop());

  return container;
}
