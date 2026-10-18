var sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

var nombresRol = {
  Fighter: "Luchador",
  Tank: "Tanque",
  Mage: "Mago",
  Assassin: "Asesino",
  Marksman: "Tirador",
  Support: "Soporte"
};

var coloresRol = {
  Fighter: "#e8843c",
  Tank: "#3c8ee8",
  Mage: "#9b6bff",
  Assassin: "#e84057",
  Marksman: "#f0c24b",
  Support: "#3ce88a"
};

var parche = "";
var listaCampeones = [];
var rolActual = "Todos";
var maxVida = 1;
var maxDano = 1;
var campeonAbierto = null;

// elementos del html
var grid = document.getElementById("grid");
var inputBusca = document.getElementById("busca");
var selectOrden = document.getElementById("orden");
var textoConteo = document.getElementById("conteo");
var modal = document.getElementById("modal");
var sliderNivel = document.getElementById("nivel");
var logoUcn = document.getElementById("logoUcn");
var heroFondos = document.getElementById("heroFondos");
var barraProgreso = document.getElementById("progreso");

/* ---------- cargar datos ---------- */

async function cargarCampeones() {
  try {
    var resp1 = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
    var versiones = await resp1.json();
    parche = versiones[0];

    var url = "https://ddragon.leagueoflegends.com/cdn/" + parche + "/data/es_MX/champion.json";
    var resp2 = await fetch(url);
    var datos = await resp2.json();

    var lista = Object.values(datos.data);
    for (var i = 0; i < lista.length; i++) {
      var c = lista[i];
      listaCampeones.push({
        id: c.id,
        nombre: c.name,
        titulo: c.title,
        descripcion: c.blurb,
        roles: c.tags,
        vida: c.stats.hp,
        dano: c.stats.attackdamage,
        info: c.info,
        stats: c.stats,
        tipoDano: calcularTipoDano(c.info)
      });
    }

    // para saber cuanto llenar cada barra
    for (var j = 0; j < listaCampeones.length; j++) {
      if (listaCampeones[j].vida > maxVida) maxVida = listaCampeones[j].vida;
      if (listaCampeones[j].dano > maxDano) maxDano = listaCampeones[j].dano;
    }

    console.log("campeones cargados:", listaCampeones.length);
    crearBotonesRol();
    mostrarCampeones();
    iniciarFondoHero();
  } catch (error) {
    console.log("error al cargar:", error);
    textoConteo.textContent = "";
    grid.innerHTML = '<p class="error">No se pudieron cargar los campeones. Revisa tu internet y recarga la página.</p>';
  }
}

// segun los numeros de la api decidimos si el daño es fisico o magico
function calcularTipoDano(info) {
  if (info.magic >= 6 && info.attack <= 5) return "Mágico";
  if (info.attack >= 6 && info.magic <= 5) return "Físico";
  return "Mixto";
}


function crearBotonesRol() {
  var contenedor = document.getElementById("roles");
  var html = '<button class="rol-btn activo" data-rol="Todos">Todos</button>';
  for (var rol in nombresRol) {
    html += '<button class="rol-btn" data-rol="' + rol + '">' + nombresRol[rol] + "</button>";
  }
  contenedor.innerHTML = html;

  contenedor.addEventListener("click", function (e) {
    var boton = e.target.closest(".rol-btn");
    if (!boton) return;
    rolActual = boton.dataset.rol;
    var botones = contenedor.querySelectorAll(".rol-btn");
    botones.forEach(function (b) {
      b.classList.remove("activo");
    });
    boton.classList.add("activo");
    mostrarCampeones();
  });
}

inputBusca.addEventListener("input", mostrarCampeones);
selectOrden.addEventListener("change", mostrarCampeones);

function mostrarCampeones() {
  var texto = inputBusca.value.trim().toLowerCase();
  var orden = selectOrden.value;
  var filtrados = [];

  for (var i = 0; i < listaCampeones.length; i++) {
    var c = listaCampeones[i];
    var cumpleRol = rolActual === "Todos" || c.roles.indexOf(rolActual) !== -1;
    var cumpleNombre = c.nombre.toLowerCase().indexOf(texto) !== -1;
    if (cumpleRol && cumpleNombre) filtrados.push(c);
  }

  filtrados.sort(function (a, b) {
    if (orden === "hp") return b.vida - a.vida;
    if (orden === "ad") return b.dano - a.dano;
    if (orden === "dificultad") return b.info.difficulty - a.info.difficulty;
    return a.nombre.localeCompare(b.nombre, "es");
  });

  textoConteo.textContent = filtrados.length + " campeones · parche " + parche;

  if (filtrados.length === 0) {
    grid.innerHTML = '<p class="error">No hay campeones con ese nombre.</p>';
    return;
  }

  var html = "";
  for (var k = 0; k < filtrados.length; k++) {
    html += crearCarta(filtrados[k], k);
  }
  grid.innerHTML = html;

  var cartas = grid.querySelectorAll(".carta");
  cartas.forEach(function (carta) {
    observador.observe(carta);
  });
}

function crearCarta(c, posicion) {
  var chips = "";
  for (var i = 0; i < c.roles.length; i++) {
    chips += '<span class="chip">' + (nombresRol[c.roles[i]] || c.roles[i]) + "</span>";
  }

  var claseDano = "dano-mixto";
  if (c.tipoDano === "Físico") claseDano = "dano-fisico";
  if (c.tipoDano === "Mágico") claseDano = "dano-magico";

  var color = coloresRol[c.roles[0]] || "#c8aa6e";
  var porcVida = (c.vida / maxVida) * 100;
  var porcDano = (c.dano / maxDano) * 100;
  var retraso = (posicion % 8) * 0.05;

  return (
    '<article class="carta" tabindex="0" role="button" data-id="' + c.id + '" ' +
    'style="--d:' + retraso + "s; --color-rol:" + color + '" aria-label="Ver detalle de ' + c.nombre + '">' +
      '<div class="arte">' +
        '<img loading="lazy" alt="" src="https://ddragon.leagueoflegends.com/cdn/img/champion/loading/' + c.id + '_0.jpg">' +
        '<div class="arte-degradado"></div>' +
        '<div class="brillo"></div>' +
        '<div class="arte-nombre"><h3>' + c.nombre + '</h3><p class="titulo">' + c.titulo + "</p></div>" +
      "</div>" +
      '<div class="datos">' +
        '<div class="chips">' + chips + '<span class="chip ' + claseDano + '">' + c.tipoDano + "</span></div>" +
        '<div class="barra"><span>Vida</span><span class="pista"><span class="relleno hp" style="--w:' + porcVida + '%"></span></span><b>' + Math.round(c.vida) + "</b></div>" +
        '<div class="barra"><span>Daño</span><span class="pista"><span class="relleno ad" style="--w:' + porcDano + '%"></span></span><b>' + Math.round(c.dano) + "</b></div>" +
      "</div>" +
    "</article>"
  );
}


var observador = new IntersectionObserver(function (entradas) {
  entradas.forEach(function (entrada) {
    if (entrada.isIntersecting) {
      entrada.target.classList.add("visible");
      observador.unobserve(entrada.target);
    }
  });
}, { threshold: 0.1 });

/* ---------- animacion de las cartas con el mouse ---------- */
// la carta gira segun donde este el mouse dentro de ella

grid.addEventListener("pointermove", function (e) {
  var carta = e.target.closest(".carta");
  if (!carta || sinMovimiento || e.pointerType === "touch") return;

  var caja = carta.getBoundingClientRect();
  var x = (e.clientX - caja.left) / caja.width;   
  var y = (e.clientY - caja.top) / caja.height;

  carta.style.setProperty("--ry", (x - 0.5) * 16 + "deg");
  carta.style.setProperty("--rx", (0.5 - y) * 16 + "deg");
  carta.style.setProperty("--gx", x * 100 + "%");
  carta.style.setProperty("--gy", y * 100 + "%");
});

grid.addEventListener("pointerout", function (e) {
  var carta = e.target.closest(".carta");
  if (!carta) return;
  carta.style.setProperty("--rx", "0deg");
  carta.style.setProperty("--ry", "0deg");
});

grid.addEventListener("click", function (e) {
  var carta = e.target.closest(".carta");
  if (carta) abrirModal(carta.dataset.id);
});

grid.addEventListener("keydown", function (e) {
  if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("carta")) {
    e.preventDefault();
    abrirModal(e.target.dataset.id);
  }
});

/* ---------- ventana de detalle ---------- */

// formula de la wiki: stat = base + crecimiento * (n-1) * (0.7025 + 0.0175 * (n-1))
function statPorNivel(base, crecimiento, nivel) {
  return base + crecimiento * (nivel - 1) * (0.7025 + 0.0175 * (nivel - 1));
}

function mostrarStats() {
  var nivel = Number(sliderNivel.value);
  var s = campeonAbierto.stats;
  document.getElementById("nivelTxt").textContent = nivel;

  var filas = [
    ["Vida", statPorNivel(s.hp, s.hpperlevel, nivel)],
    ["Daño de ataque", statPorNivel(s.attackdamage, s.attackdamageperlevel, nivel)],
    ["Armadura", statPorNivel(s.armor, s.armorperlevel, nivel)],
    ["Resist. mágica", statPorNivel(s.spellblock, s.spellblockperlevel, nivel)],
    ["Velocidad de mov.", s.movespeed],
    ["Alcance", s.attackrange]
  ];

  var html = "";
  for (var i = 0; i < filas.length; i++) {
    html += "<div><dt>" + filas[i][0] + "</dt><dd>" + Math.round(filas[i][1]) + "</dd></div>";
  }
  document.getElementById("mStats").innerHTML = html;
}

function abrirModal(id) {
  for (var i = 0; i < listaCampeones.length; i++) {
    if (listaCampeones[i].id === id) campeonAbierto = listaCampeones[i];
  }

  document.getElementById("mImg").src = "https://ddragon.leagueoflegends.com/cdn/img/champion/loading/" + id + "_0.jpg";
  document.getElementById("mNombre").textContent = campeonAbierto.nombre;
  document.getElementById("mTitulo").textContent = campeonAbierto.titulo;
  document.getElementById("mDesc").textContent = campeonAbierto.descripcion;

  var chips = "";
  for (var j = 0; j < campeonAbierto.roles.length; j++) {
    chips += '<span class="chip">' + (nombresRol[campeonAbierto.roles[j]] || campeonAbierto.roles[j]) + "</span>";
  }
  chips += '<span class="chip">Daño ' + campeonAbierto.tipoDano.toLowerCase() + "</span>";
  document.getElementById("mRoles").innerHTML = chips;

  sliderNivel.value = 1;
  mostrarStats();
  modal.classList.add("abierto");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("bloqueado");
  document.getElementById("cerrar").focus();
}

function cerrarModal() {
  modal.classList.remove("abierto");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("bloqueado");
}

sliderNivel.addEventListener("input", mostrarStats);
document.getElementById("cerrar").addEventListener("click", cerrarModal);
modal.addEventListener("click", function (e) {
  if (e.target === modal) cerrarModal();
});
window.addEventListener("keydown", function (e) {
  if (e.key === "Escape") cerrarModal();
});

/* ---------- animacion con el scroll ---------- */
// el fondo del hero y el logo bajan mas lento que la pagina (parallax)

window.addEventListener("scroll", function () {
  var scroll = window.scrollY;

  if (!sinMovimiento) {
    heroFondos.style.transform = "translateY(" + scroll * 0.3 + "px)";
    logoUcn.style.transform = "translateY(" + scroll * 0.4 + "px)";
  }

  var altoTotal = document.documentElement.scrollHeight - window.innerHeight;
  var porcentaje = altoTotal > 0 ? scroll / altoTotal : 0;
  barraProgreso.style.transform = "scaleX(" + porcentaje + ")";
}, { passive: true });

/* ---------- fondo con particulas (animacion propia) ---------- */
// las particulas suben solas y se alejan del mouse

var canvas = document.getElementById("fondo");
var ctx = canvas.getContext("2d");
var ancho, alto;
var particulas = [];
var mouse = { x: -999, y: -999 };

function crearParticulas() {
  ancho = canvas.width = window.innerWidth;
  alto = canvas.height = window.innerHeight;

  var cantidad = ancho < 700 ? 40 : 90;
  particulas = [];
  for (var i = 0; i < cantidad; i++) {
    particulas.push({
      x: Math.random() * ancho,
      y: Math.random() * alto,
      radio: Math.random() * 2 + 0.6,
      velocidad: Math.random() * 0.5 + 0.15,
      empujeX: 0,
      empujeY: 0,
      esAzul: Math.random() > 0.5
    });
  }
}
crearParticulas();
window.addEventListener("resize", crearParticulas);
window.addEventListener("pointermove", function (e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

function animarParticulas() {
  ctx.clearRect(0, 0, ancho, alto);

  for (var i = 0; i < particulas.length; i++) {
    var p = particulas[i];

    // distancia al mouse, si esta cerca la empujamos hacia afuera
    var difX = p.x - mouse.x;
    var difY = p.y - mouse.y;
    var distancia = Math.sqrt(difX * difX + difY * difY);
    var alcance = 130;

    if (distancia < alcance && distancia > 0 && !sinMovimiento) {
      var fuerza = (1 - distancia / alcance) * 3;
      p.empujeX += (difX / distancia) * fuerza;
      p.empujeY += (difY / distancia) * fuerza;
    }

    // el empuje se va frenando
    p.empujeX *= 0.92;
    p.empujeY *= 0.92;

    p.x += p.empujeX + Math.sin(p.y / 60) * 0.2;
    p.y += p.empujeY;
    if (!sinMovimiento) p.y -= p.velocidad;

    // si sale por arriba vuelve a aparecer abajo
    if (p.y < -10) {
      p.y = alto + 10;
      p.x = Math.random() * ancho;
    }

    ctx.fillStyle = p.esAzul ? "rgba(10, 200, 185, .8)" : "rgba(200, 170, 110, .8)";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(animarParticulas);
}
animarParticulas();

/* ---------- fondo del hero (cambia de campeon cada 7 seg) ---------- */

var campeonesHero = ["Yasuo", "Jinx", "Ahri", "Lux", "Kaisa", "Ezreal", "Aatrox", "Sylas", "Viego", "Zed", "Irelia", "Akali"];

function iniciarFondoHero() {
  var capas = document.querySelectorAll(".hero-bg");
  var disponibles = [];

  for (var i = 0; i < campeonesHero.length; i++) {
    for (var j = 0; j < listaCampeones.length; j++) {
      if (listaCampeones[j].id === campeonesHero[i]) disponibles.push(listaCampeones[j]);
    }
  }
  if (disponibles.length === 0) return;

  var indice = Math.floor(Math.random() * disponibles.length);
  var capaActual = 0;

  function cambiarFondo() {
    var c = disponibles[indice % disponibles.length];
    var url = "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/" + c.id + "_0.jpg";
    var imagen = new Image();

    imagen.onload = function () {
      var nueva = capas[capaActual];
      var vieja = capas[1 - capaActual];
      nueva.style.backgroundImage = "url(" + url + ")";
      nueva.classList.remove("activo");
      void nueva.offsetWidth; // truco para reiniciar el zoom
      nueva.classList.add("activo");
      vieja.classList.remove("activo");
      capaActual = 1 - capaActual;
      indice++;
    };
    imagen.src = url;
  }

  cambiarFondo();
  if (!sinMovimiento) setInterval(cambiarFondo, 7000);
}

cargarCampeones();
