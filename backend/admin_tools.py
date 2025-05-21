from netmiko import ConnectHandler

def conectar_router(ip, usuario, clave):
    return ConnectHandler(
        device_type="cisco_ios",
        host=ip,
        username=usuario,
        password=clave
    )

def mostrar_interfaces(ip, usuario, clave):
    conn = conectar_router(ip, usuario, clave)
    salida = conn.send_command("show ip interface brief")
    conn.disconnect()
    return salida

def mostrar_rutas(ip, usuario, clave):
    conn = conectar_router(ip, usuario, clave)
    salida = conn.send_command("show ip route")
    conn.disconnect()
    return salida

def crear_interfaz(ip, usuario, clave, interfaz, direccion, mascara):
    conn = conectar_router(ip, usuario, clave)
    comandos = [
        f"interface {interfaz}",
        f"ip address {direccion} {mascara}",
        "no shutdown"
    ]
    salida = conn.send_config_set(comandos)
    conn.disconnect()
    return salida
