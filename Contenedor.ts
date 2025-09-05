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

  extra: T; // genérico, puede ser cualquier cosa (ej: tarjeta, email, etc.)




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

const contenedorNumeros = new Contenedor<number>();

contenedorNumeros.agregar(10);
contenedorNumeros.agregar(20);
contenedorNumeros.mostrarTodos();

console.log("Primer número:", contenedorNumeros.obtenerPrimero());

const bus = new Vehiculo("BUS-123", "Bus", 50);
const taxi = new Vehiculo(2024, "Taxi", 4);

bus.info();
taxi.info();

const conductor: Conductor = {
  nombre: "Carlos",
  salario: 2000,
  licencia: "LIC-456"
};

console.log("Conductor:", conductor);

const pasajero1 = new Pasajero<string>("Ana", 5000, "Tarjeta123");
const pasajero2 = new Pasajero<{ email: string }>("Luis", 3000, { email: "luis@mail.com" });

pasajero1.pagar(2000);
pasajero2.pagar(4000);

console.log("Pasajero1 extra:", pasajero1.extra);
console.log("Pasajero2 extra:", pasajero2.extra);