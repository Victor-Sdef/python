// js/topologia.js

async function explorar() {
  const ip1 = document.getElementById("ip1").value;
  const user1 = document.getElementById("user1").value;
  const pass1 = document.getElementById("pass1").value;
  const ip2 = document.getElementById("ip2").value;
  const user2 = document.getElementById("user2").value;
  const pass2 = document.getElementById("pass2").value;

  const respuesta = await fetch("http://localhost:8000/cdp-multisalto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      saltos: [
        { host: ip1, username: user1, password: pass1 },
        { host: ip2, username: user2, password: pass2 }
      ]
    })
  });

  const data = await respuesta.json();
  if (data.error) {
    document.getElementById("log").innerHTML = `<li style="color:red;">❌ ${data.error}</li>`;
    return;
  }

  document.getElementById("log").innerHTML = "<li>✅ Topología detectada</li>";
  dibujarTopologia(data);
}

function dibujarTopologia(topologia) {
  const svg = d3.select("#svg-topologia");
  svg.selectAll("*").remove();

  let nodes = [];
  let links = [];

  topologia.forEach(({ origen, vecinos }) => {
    if (!nodes.find(n => n.id === origen)) nodes.push({ id: origen, color: "cyan" });

    vecinos.forEach(v => {
      if (!nodes.find(n => n.id === v.hostname)) {
        nodes.push({ id: v.hostname, color: "limegreen" });
      }
      links.push({ source: origen, target: v.hostname });
    });
  });

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(150))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(600, 400));

  const link = svg.append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke", "#ccc");

  const node = svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 20)
    .attr("fill", d => d.color)
    .call(drag(simulation));

  const label = svg.append("g")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .text(d => d.id)
    .attr("text-anchor", "middle");

  simulation.on("tick", () => {
    link.attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node.attr("cx", d => d.x).attr("cy", d => d.y);
    label.attr("x", d => d.x).attr("y", d => d.y + 5);
  });
}

function drag(simulation) {
  return d3.drag()
    .on("start", event => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    })
    .on("drag", event => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    })
    .on("end", event => {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    });
}


function agregarSalto() {
  const contenedor = document.getElementById("saltos-extra");
  const index = contenedor.children.length;
  const saltoHTML = `
    <div class="salto">
      <input type="text" placeholder="IP router #${index + 2}" class="ip-router">
      <input type="text" placeholder="Usuario router #${index + 2}" class="user-router">
      <input type="password" placeholder="Contraseña router #${index + 2}" class="pass-router">
    </div>
  `;
  contenedor.insertAdjacentHTML("beforeend", saltoHTML);
}

async function explorar() {
  const saltos = [{
    host: document.getElementById("jump_host").value,
    username: document.getElementById("jump_user").value,
    password: document.getElementById("jump_pass").value
  }];

  const extraIps = document.querySelectorAll(".ip-router");
  const extraUsers = document.querySelectorAll(".user-router");
  const extraPass = document.querySelectorAll(".pass-router");

  for (let i = 0; i < extraIps.length; i++) {
    saltos.push({
      host: extraIps[i].value,
      username: extraUsers[i].value,
      password: extraPass[i].value
    });
  }

  const respuesta = await fetch("http://localhost:8000/cdp-multisalto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ saltos })
  });

  const data = await respuesta.json();
  if (data.error) {
    document.getElementById("log").innerHTML = `<li style="color:red;">❌ ${data.error}</li>`;
    return;
  }

  document.getElementById("log").innerHTML = "<li>✅ Topología detectada</li>";
  dibujarTopologia(data);
}
