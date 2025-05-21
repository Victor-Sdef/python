# 🛠️ Network Admin Dashboard - Python + FastAPI + Netmiko

Este proyecto es un **dashboard de administración de red** que permite gestionar routers Cisco y servidores Zabbix Linux de forma visual y remota. Usa **FastAPI** como backend y Netmiko/Paramiko para conexiones SSH. El frontend es HTML + JavaScript puro y se ejecuta con Live Server.

---

## 🚀 Funcionalidades principales

- 🔐 Conexión SSH directa o con salto (multi-hop)
- 📡 Descubrimiento topológico con CDP (`show cdp neighbors`)
- 📋 Administración de interfaces (crear/editar IPs)
- 📊 Estado del servicio `zabbix-server`
- 🔄 Control de servicios (start, stop, restart)
- ✅ Panel web con interfaz interactiva

---

## 📂 Estructura del Proyecto

dashboard-1.1/
├── backend/
│ ├── main.py
│ ├── netmiko_utils.py
│ └── ...
├── frontend/
│ ├── index.html
│ ├── js/
│ ├── css/
│ └── ...
├── env/ (opcional)
├── requirements.txt
└── README.md
