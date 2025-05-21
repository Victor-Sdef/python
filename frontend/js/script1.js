async function accion(endpoint, method = "POST") {
  const host = document.getElementById("host").value;
  const username = document.getElementById("user").value;
  const password = document.getElementById("pass").value;

  const jump_host = document.getElementById("jump_host").value;
  const jump_user = document.getElementById("jump_user").value;
  const jump_pass = document.getElementById("jump_pass").value;

  const intf = document.getElementById("intf").value;
  const ip = document.getElementById("ip").value;
  const mask = document.getElementById("mask").value;

  // Adaptar método PUT y DELETE como POST con endpoints alternativos
  let realEndpoint = endpoint;
  let realMethod = method;

  if (method === "PUT") {
    realEndpoint = "interface/edit";
    realMethod = "POST";
  } else if (method === "DELETE") {
    realEndpoint = "interface/delete";
    realMethod = "POST";
  }

  const payload = {
    host: host || jump_host,
    username: username || jump_user,
    password: password || jump_pass,
    interface: intf || undefined,
    ip: ip || undefined,
    mask: mask || undefined,
    jump_host: jump_host || undefined,
    jump_user: jump_user || undefined,
    jump_pass: jump_pass || undefined
  };

  try {
    const res = await fetch(`http://localhost:8000/${realEndpoint}`, {
      method: realMethod,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    document.getElementById("output").textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    document.getElementById("output").textContent = `❌ Error: ${error.message}`;
  }
}
