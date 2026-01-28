# 🌌 SolarViz — Interactive Solar System Visualization

Uma visualização interativa do Sistema Solar que combina ***modelos orbitais estáticos***, ***dados astronômicos reais*** e ***atualizações em tempo quase real***, construída com ***ObservableHQ + D3.js, Python (astroquery/JPL)*** e ***API serverless na Vercel***.

🔗 Demo: https://solar-viz-app.vercel.app/

📦 Repositório: [ObservableHQ](https://observablehq.com/d/aba6f5ac5d71c9f3)

## 📌 Motivação

Visualizações do Sistema Solar costumam ser:

- excessivamente ***estáticas***, ou
- puramente ***artísticas***, sem compromisso com dados reais.

O ***SolarViz*** nasce para explorar um meio-termo:

- ***órbitas matematicamente modeladas*** para compreensão estrutural,
- combinadas com ***posições reais fornecidas pela NASA/JPL*** para contextualização temporal,
- mantendo foco em ***clareza visual, exploração interativa*** e ***arquitetura didática***.

O projeto foi desenvolvido como trabalho final da disciplina de ***Visualização de Dados***.

## 🧠 Ideia Central

O sistema opera em ***dois modos complementares***:

### 🔵 Modo Simulação (Static)

- Usa ***elementos orbitais*** (semi-eixo maior, excentricidade, período, etc.);
- Gera ***órbitas completas*** e contínuas;
- Ideal para ***entendimento estrutural*** do Sistema Solar.

### 🟢 Modo LIVE

- Consome dados reais do [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) ;
- Mostra ***posições instantâneas*** dos corpos celestes;
- Ideal para ***contexto temporal real***;

## 🏗️ Arquitetura do Projeto

```
Data-Visualization-SolarViz/
├── api/
│   └── live.js                  # API serverless (Vercel) - modo LIVE
│
├── data-pipeline/
│   ├── fetch_horizons.py        # Pipeline Python (JPL Horizons)
│   └── requirements.txt
│
├── data/
│   └── planets_static.json      # Elementos orbitais versionados
│
├── .github/
│   └── workflows/
│       └── update-data.yml      # Atualização automática diária
│
├── index.js                     # Front-end (ObservableHQ)
├── package.json
└── README.md
```

## 🎨 Front-end (ObservableHQ + D3.js)

O front-end foi desenvolvido no ***ObservableHQ***, utilizando:

- ***D3.js*** para renderização SVG;
- ***Mutable state*** do Observable para controle de animação;
- Arquitetura modular (funções separadas por responsabilidade).

### Funcionalidades principais

- 🌍 Sistema Sol → Planetas → Luas (hierarquia clara);
- ▶️ Play / Pause da simulação;
- ⚙️ Controle de velocidade;
- 🔍 Zoom focado em qualquer corpo celeste;
- 🟢 Alternância entre modo Static e LIVE;
- 📊 Painel de informações contextual.

### Escolhas importantes

- Projeção 2D no plano XY (eclíptica);
- Escalas logarítmicas para manter legibilidade;
- Animação desacoplada do fetch de dados LIVE.

## 📡 Backend LIVE (Vercel + NASA JPL)

O modo LIVE utiliza uma ***API serverless*** hospedada na Vercel.

### O que ela faz

- Consulta o serviço ***NASA JPL Horizons***;
- Retorna posições atuais (X, Y, Z) em quilômetros;
- Funciona como ***snapshot temporal***, não como órbita completa.

📁 Arquivo principal:

> api/live.js

Essa API é consumida pelo front-end a cada ***15 segundos***, garantindo atualização sem sobrecarregar o serviço externo.

## 🧪 Pipeline de Dados Estáticos (Python)

Para o modo estático, o projeto utiliza um ***pipeline em Python***:

> data-pipeline/fetch_horizons.py

### Tecnologias

- ```astroquery```
- ```astropy```
- ```numpy```

### O que ele faz

- Consulta o JPL Horizons;
- Extrai ***elementos orbitais***;
- Gera um JSON versionado com:
  - planetas,
  - parâmetros físicos,
  - dados necessários para simulação contínua.

📁 Saída:

> data/planets_static.json

## 🤖 Automação com GitHub Actions

O pipeline estático é executado ***automaticamente todos os dias***:

> .github/workflows/update-data.yml

### Fluxo

1. Executa o script Python
2. Atualiza o JSON de dados
3. Faz commit automático se houver mudanças

Isso garante:

- dados sempre atualizados
- reprodutibilidade
- versionamento científico

## 🚀 Tecnologias Utilizadas

- JavaScript
- D3.js
- ObservableHQ
- Python
- astroquery / astropy
- NASA JPL Horizons
- GitHub Actions
- Vercel (Serverless Functions)


## 📝 License

Este projeto possui uma Licença MIT License - veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

## 👨‍💻 Autores

<table align="left">
  <tr align="center">
    <td>
      <a href="https://github.com/daviteixeira-dev">
        <img src="https://avatars.githubusercontent.com/daviteixeira-dev" width=100 />
        <p>Davi Teixeira</p>
      </a>
    </td>
    <td>
      <a href="https://github.com/joaoVictorBAlves">
        <img src="https://avatars.githubusercontent.com/u/86852231?v=4" width=100 />
        <p>João Victor</p>
      </a>
    </td>
  </tr>
</table>
