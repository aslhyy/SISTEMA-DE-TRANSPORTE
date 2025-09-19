# Informe SOLID (S y O) — Proyecto: Análisis TypeScript del repositorio
## 1. Contexto
Este informe analiza clases reales encontradas en el código fuente provisto para el proyecto Sistema de Transporte. El objetivo es verificar S (Single Responsibility) y O (Open/Closed) para cada clase, justificar con evidencia del código y, cuando haya conflictos, proponer refactors concretos (protótipos de código antes → después).

<br>

**Alcance:** se analizaron las clases y tipos realmente presentes en el código compartido: Contenedor<T>, Vehiculo, Pasajero<T>, y los tipos/interfaces auxiliares (Persona, Trabajador, Conductor). No se crearon clases nuevas sólo para cumplir la tarea; las propuestas de refactor son opcionales y presentadas como prototipos.
<br>

## 2. Inventario de Clases Analizadas

**Clase 1:** src/models/Contenedor.ts — Contenedor<T> — Rol: contenedor genérico en memoria para elementos.

<br>

**Clase 2:** src/models/Vehiculo.ts — Vehiculo — Rol: modelo simple de vehículo con id, tipo y capacidad.
<br>

**Clase 3:** src/models/Pasajero.ts — Pasajero<T> — Rol: representa un pasajero con nombre, saldo y operación pagar.
<br>

**Tipos/Interfaces auxiliares (no clases):** Persona, Trabajador, Conductor — definiciones de tipo usadas en el dominio.

## 3. Análisis por Clase
### 3.1 src/models/Contenedor.ts — Contenedor<T>
**Responsabilidad declarada:** almacenar y exponer operaciones sencillas sobre una colección en memoria.
####S (Single Responsibility)
**Diagnóstico:** Cumple parcialmente.
**Justificación:** Contenedor<T> implementa únicamente métodos relacionados con la gestión de la colección (agregar, obtenerPrimero, mostrarTodos). Estas operaciones pertenecen al mismo motivo de cambio: la forma en que se almacenan/recuperan elementos en memoria. No hay mezcla con persistencia externa ni lógica de negocio adicional.
**Riesgo si se mantiene así:** Bajo. La clase es pequeña y testeable. Si se añadiera lógica de persistencia (ej. guardar en DB) o validación de elementos, entonces rompería SRP.
####O (Open/Closed)
*Diagnóstico:* No cumple totalmente (abierta a extensión limitada).
*Justificación:* Actualmente la clase no está preparada para extender comportamiento (por ejemplo: validación al agregar, notificaciones, persistencia alternativa) sin modificarla. Cualquier nueva política (filtrado, logging, persistencia) obligaría a cambiar Contenedor.
### Refactor propuesto (antes → después)
// Antes
class Contenedor<T> {
private items: T[] = [];
agregar(item: T): void { this.items.push(item); console.log("Agregado:", item); }
obtenerPrimero(): T | undefined { return this.items[0]; }
mostrarTodos(): void { console.log("Contenido:", this.items); }
}

// Después: abrir por composición y estrategias
interface AddPolicy<T> { beforeAdd?(item: T): void; afterAdd?(item: T): void; }

class Contenedor<T> {
private items: T[] = [];
constructor(private policy?: AddPolicy<T>) {}

agregar(item: T): void {
this.policy?.beforeAdd?.(item);
this.items.push(item);
this.policy?.afterAdd?.(item);
}

obtenerPrimero(): T | undefined { return this.items[0]; }
mostrarTodos(): T[] { return [...this.items]; }
}
*Impacto:* nuevas responsabilidades (logging, validación, persistencia) se implementan creando nuevas AddPolicy sin modificar Contenedor

### 3.2 src/models/Vehiculo.ts — Vehiculo
**Responsabilidad declarada:** representar datos de un vehículo y exponer una función info() para mostrar por consola.
####S (Single Responsibility)
Diagnóstico: Cumple.
Justificación: Vehiculo contiene sólo estado (id, tipo, capacidad) y un método info() orientado a presentar información. Ambos están cohesivos: el motivo de cambio sería el modelo de datos del vehículo. Sin embargo, info() imprime a console.log, lo que introduce una dependencia de salida (IO) dentro del modelo.
Riesgo si se mantiene así: Moderado: mezclar modelo de dominio con salida a consola afecta pruebas y reutilización (por ejemplo, no es trivial reutilizar Vehiculo.info() para UI o logs centralizados).
####Refactor propuesto (mejora SRP y OCP)
// Antes
class Vehiculo { info(): void { console.log(`Vehiculo: [${this.id}] - Tipo: ${this.tipo}, Capacidad: ${this.capacidad}`); } }

// Después: separar presentación (single responsibility) y hacer la clase abierta a formatos variados
interface VehiculoFormatter { format(v: Vehiculo): string }

class Vehiculo {
constructor(public id: Id, public tipo: TipoVehiculo, public capacidad: number) {}
}

class VehiculoConsoleFormatter implements VehiculoFormatter {
format(v: Vehiculo) { return `Vehiculo: [${v.id}] - Tipo: ${v.tipo}, Capacidad: ${v.capacidad}`; }
}

// Uso
const fmt = new VehiculoConsoleFormatter();
console.log(fmt.format(bus));
**Impacto:** el modelo queda limpio; nuevas formas de presentar (JSON, HTML, logger) se añaden implementando VehiculoFormatter sin tocar Vehiculo.