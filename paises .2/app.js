let allCountries = []; // Variável para armazenar todos os países
let currentOrder = 'desc'; // Variável para armazenar a ordem atual (ascendente ou descendente)

const searchInput = document.getElementById("search");
const sortBtn = document.getElementById("sortBtn");
const countriesContainer = document.getElementById("countries");
const messageEl = document.getElementById("message");

// spinner (cria dinamicamente)
const spinner = document.createElement("div");
spinner.id = "spinner";
spinner.textContent = "Carregando...";
spinner.style.padding = "1rem";
spinner.style.fontStyle = "italic";


// Faz a requisição e retorna os países ou lança erro
async function getCountries() {
  try {
    const res = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,flags,population"
    );

    // 1. Verificar se a resposta é ok (status 200-299).
      if (!res.ok) {
          throw new Error('Status inesperado:' + res.status);
      }

    // 2. Converter a resposta para JSON.
      const data = await res.json();
      
    // 3. Retornar os dados.
      return data;
      
  } catch (e) {
    // 4. Se der erro de rede ou outro, relançar ou transformar numa mensagem clara.
    throw new Error('Falha ao buscar países');
  }
}


// --- renderização ---
function renderCountries(countries) { 
    countriesContainer.innerHTML = ""; // Limpa o conteúdo anterior
    if (!countries || countries.length === 0) {
      countriesContainer.textContent = "Nenhum país encontrado.";
      return;
    }

    countries.forEach(country => {
      // Desestruturação dos dados do país
      const {
            name: { common },   // nomes 
            flags: { svg },     // url da bandeira
            population,         // população
        } = country;
        

      // 1. Criar o elemento raiz do país (div.country)
      const countryEl = document.createElement("div");
      countryEl.classList.add("country");

      // 2. Criar a imagem da bandeira
      const img = document.createElement("img");
      img.classList.add("flag");
      img.src = svg;
      img.alt = `Bandeira de ${common}`;

      // 3. Criar o bloco de info (nome + população)
      const info = document.createElement("div");
      info.classList.add("info");

      const nameEl = document.createElement("div");
      nameEl.textContent = common;

      const popEl = document.createElement("div");
        // formata população com separador de milhares:
      popEl.textContent =
        "População: " + new Intl.NumberFormat("pt-BR").format(population);

      // 4. Montar a hierarquia
      info.appendChild(nameEl);
      info.appendChild(popEl);
      countryEl.appendChild(img);
      countryEl.appendChild(info);
      countriesContainer.appendChild(countryEl);
    });
}

/* * * * * * * * * * TESTE RÁPIDO * * * * * * * * * */

(async () => {
  try {
    const countries = await getCountries();
    console.log('Número de países recebidos:', countries.length);
      
    renderCountries(countries);
  } catch (e) {
    console.error('Erro ao buscar países:', e.message);
    document.getElementById('message').textContent = 'Não foi possível carregar os países.';
  }
})();

/* * * * * * * * * * * * * * * * * * * * * * * * */

function debounce(fn, delay) {
    let timer;
    return (...args) => { 
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function applyFilters() {
    const term = searchInput.value.toLowerCase().trim();

    let filtered = allCountries.filter(country => {
        const name = country.name?.common?.toLowerCase() || "Desconhecido";
        return name.includes(term);
    });

    filtered.sort((a, b) => {
        const popA = a.population || 0;
        const popB = b.population || 0;

        return currentOrder === 'asc' ? popA - popB : popB - popA;
    });

    localStorage.setItem("pais_filtro", searchInput.value);
    localStorage.setItem("pais_ordem", currentOrder);

    renderCountries(filtered);
}

const debouncedApply = debounce(applyFilters, 300);

searchInput.addEventListener("input", debouncedApply);

sortBtn.addEventListener("click", () => {
    currentOrder = currentOrder === "desc" ? "asc" : "desc";
    sortBtn.dataset.order = currentOrder;
    sortBtn.textContent =
        currentOrder === "desc"
        ? "Ordenar por população ↓"
        : "Ordenar por população ↑";
    applyFilters();
});


// --- inicialização ---
(async () => {
  try {
    // reaplica filtro/ordem salvos
    const savedFilter = localStorage.getItem("pais_filtro") || "";
    const savedOrder = localStorage.getItem("pais_ordem") || "desc";
    searchInput.value = savedFilter;
    currentOrder = savedOrder;
    sortBtn.dataset.order = currentOrder;
    sortBtn.textContent =
      currentOrder === "desc"
        ? "Ordenar por população ↓"
        : "Ordenar por população ↑";

    // mostra spinner
    countriesContainer.innerHTML = "";
    countriesContainer.appendChild(spinner);

    allCountries = await getCountries();

    // tira spinner
    spinner.remove();

    // primeira exibição
    applyFilters();
  } catch (e) {
    console.error("Erro ao buscar países:", e.message);
    spinner.remove();
    messageEl.textContent = "Não foi possível carregar os países.";
  }
})();