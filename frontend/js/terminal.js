let currentHost = "";

// Lista de comandos comunes para autocompletado
const comandosDisponibles = [
  "show ip interface brief",
  "show running-config",
  "show version",
  "show cdp neighbors",
  "show cdp neighbors detail",
  "show interfaces",
  "ping",
  "traceroute"
];

// 🔐 Conexión SSH
document.getElementById("form-login").addEventListener("submit", async function (e) {
  e.preventDefault();
  const ip = document.getElementById("ip").value;
  const usuario = document.getElementById("usuario").value;
  const clave = document.getElementById("clave").value;

  const res = await fetch("http://localhost:8000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      device_type: "cisco_ios",
      host: ip,
      username: usuario,
      password: clave
    })
  });

  const data = await res.json();

  if (data.mensaje) {
    currentHost = ip;
    document.getElementById("form-login").style.display = "none";
    document.getElementById("terminal-area").style.display = "flex";
    document.getElementById("terminal-output").innerHTML += `✅ Conectado a ${ip}\n`;
  } else {
    alert("❌ Error de conexión: " + data.error);
  }
});

// 🎯 Ejecutar comando al presionar ENTER
const textarea = document.getElementById("comando");
textarea.addEventListener("keydown", async function (e) {
  // Autocompletado con TAB
  if (e.key === "Tab") {
    e.preventDefault();
    const input = textarea.value.toLowerCase();
    const sugerencia = comandosDisponibles.find(cmd => cmd.startsWith(input));
    if (sugerencia) {
      textarea.value = sugerencia;
    }
  }

  // Ejecutar al presionar ENTER (sin Shift)
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const comando = textarea.value.trim();
    const output = document.getElementById("terminal-output");

    if (comando === "") return;

    output.innerHTML += `> ${comando}\n`;

    const res = await fetch("http://localhost:8000/comando", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: currentHost,
        command: comando
      })
    });

    const data = await res.json();

    if (data.error) {
      output.innerHTML += `❌ ${data.error}\n`;
    } else {
      output.innerHTML += `${data.salida}\n`;
    }

    textarea.value = "";
    output.scrollTop = output.scrollHeight;
  }
});
    