import { input, select } from "@inquirer/prompts";


class Contenedor<T> {
    private items: T[] = [];

    agregar(item: T): void {
        this.items.push(item);
        console.log("Agregado:", item);
    }

    obtenerPrimero(): T | undefined {
        return this.items[0];
    }

    mostrarTodos(): void {
        console.log("Contenido:", this.items);
    }
}

type TipoVehiculo = "Bus" | "Taxi" | "Metro" | "Moto";
type Id = string | number;

class Vehiculo {
    id: Id;
    tipo: TipoVehiculo;
    capacidad: number;

    constructor(id: Id, tipo: TipoVehiculo, capacidad: number) {
        this.id = id;
        this.tipo = tipo;
        this.capacidad = capacidad;
    }

    info(): void {
        console.log(`Vehiculo: [${this.id}] - Tipo: ${this.tipo}, Capacidad: ${this.capacidad}`);
    }
}

interface Persona {
    nombre: string;
}

interface Trabajador {
    salario: number;
}

type Conductor = Persona & Trabajador & { licencia: string };

class Pasajero<T> {
    nombre: string;
    saldo: number;
    extra: T;

    constructor(nombre: string, saldo: number, extra: T) {
        this.nombre = nombre;
        this.saldo = saldo;
        this.extra = extra;
    }

    pagar(monto: number): void {
        if (this.saldo >= monto) {
            this.saldo -= monto;
            console.log(`${this.nombre} pagó $${monto}. Saldo restante: ${this.saldo}`);
        } else {
            console.log(`${this.nombre} no tiene saldo suficiente.`);
        }
    }
}

const contenedorVehiculos = new Contenedor<Vehiculo>();
const contenedorConductores = new Contenedor<Conductor>();
const contenedorPasajeros = new Contenedor<Pasajero<any>>();

async function sistemaTransporteMenu() {
    console.log("Bienvenido al sistema de Transporte");
    let salir = false;
    while (!salir) {
        const opcion = await select({
            message: "===== Sistema de transporte =====",
            choices: [
                { name: "1. Agregar vehículo🚗", value: "1" },
                { name: "2. Mostrar vehículos🚎", value: "2" },
                { name: "3. Agregar conductor🤵‍♂️", value: "3" },
                { name: "4. Mostrar conductores👨‍✈️", value: "4" },
                { name: "5. Agregar pasajero👨‍🎨", value: "5" },
                { name: "6. Mostrar pasajeros🧛", value: "6" },
                { name: "0. Salir", value: "0" }
            ]
        
        });
    


switch (opcion) {
            case "1": {
                const id = await input({ message: "ID del vehículo:" });
                const tipo = await select({
                    message: "Tipo de vehículo:",
                    choices: [
                        { name: "Bus", value: "Bus" },
                        { name: "Taxi", value: "Taxi" },
                        { name: "Metro", value: "Metro" },
                        { name: "Moto", value: "Moto" }
                    ]
                });
                const capacidadInput = await input({ message: "Capacidad del vehículo:" });
                const capacidad = Number(capacidadInput) || 0;
                const vehiculo = new Vehiculo(id, tipo as TipoVehiculo, capacidad);
                contenedorVehiculos.agregar(vehiculo);
                break;
            }
            case "2": {
                contenedorVehiculos.mostrarTodos();
                break;
            }
            case "3": {
                const nombre = await input({ message: "Nombre del conductor:" });
                const salarioInput = await input({ message: "Salario del conductor:" });
                const salario = Number(salarioInput) || 0;
                const licencia = await input({ message: "Licencia del conductor:" });
                const conductor: Conductor = { nombre, salario, licencia };
                contenedorConductores.agregar(conductor);
                break;
            }
            case "4": {
                contenedorConductores.mostrarTodos();
                break;
            }
            case "5": {
                const nombre = await input({ message: "Nombre del pasajero:" });
                const saldoInput = await input({ message: "Saldo inicial del pasajero:" });
                const saldo = Number(saldoInput) || 0;
                const tipoExtra = await select({
                    message: "Tipo de dato extra:",
                    choices: [
                        { name: "Tarjeta (string)", value: "tarjeta" },
                        { name: "Email (objeto)", value: "email" }
                    ]
                });
                let extra: any;
                if (tipoExtra === "tarjeta") {
                    extra = await input({ message: "Número de tarjeta:" });
                } else {
                    const email = await input({ message: "Email del pasajero:" });
                    extra = { email };
                }
                const pasajero = new Pasajero(nombre, saldo, extra);
                contenedorPasajeros.agregar(pasajero);
                break;
            }
            case "6": {
                contenedorPasajeros.mostrarTodos();
                break;
            }
            case "0": {
                console.log("👋 Saliendo del programa...");
                salir = true;
                break;
            }
            default: {
                console.log("❌ Opción no válida, intenta de nuevo.");
                break;
            }
        }
    }
}

sistemaTransporteMenu();


