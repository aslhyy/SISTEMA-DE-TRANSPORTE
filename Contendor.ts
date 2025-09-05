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