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

###3.3 src/models/Pasajero.ts — Pasajero<T>
*Responsabilidad declarada:*  representar un pasajero y manejar el pago (pagar).
####S (Single Responsibility)
*Diagnóstico:* No cumple completamente.
*Justificación:* Pasajero mantiene estado del pasajero (nombre, saldo, extra) y además implementa la lógica de negocio pagar. En sistemas simples eso puede aceptarse; sin embargo, pagar mezcla reglas de negocio (verifica saldo y resta) y lógica de salida (console.log) — eso introduce múltiples razones de cambio: formato de notificación, política de saldo, y almacenamiento del saldo.
*Riesgo si se mantiene así:* pruebas más acopladas, imposibilidad de sustituir la política de pago (por ejemplo, cobrar con distintas tarifas, descuentos) sin modificar la clase.
####O (Open/Closed)
*Diagnóstico:* No cumple.
*Justificación:* La operación pagar es un método monolítico que, si hay cambios en la política de cobro (recargo, descuento, verificación), obliga a modificar Pasajero. Además la notificación por consola está embebida.
####Refactor propuesto (antes → después)
// Antes
class Pasajero<T> {
nombre: string; saldo: number; extra: T;
pagar(monto: number): void {
if (this.saldo >= monto) { this.saldo -= monto; console.log(${this.nombre} pagó $${monto}. Saldo restante: ${this.saldo}); }
else { console.log(${this.nombre} no tiene saldo suficiente.); }
}
}

// Después: separar política de cobro y notificación
interface PaymentPolicy { canCharge(p: Pasajero<any>, amount: number): boolean; charge(p: Pasajero<any>, amount: number): void; }
interface Notifier { notify(message: string): void; }

class Pasajero<T> {
constructor(public nombre: string, public saldo: number, public extra: T) {}
}

class DefaultPaymentPolicy implements PaymentPolicy {
canCharge(p: Pasajero<any>, amount: number) { return p.saldo >= amount; }
charge(p: Pasajero<any>, amount: number) { p.saldo -= amount; }
}.
class ConsoleNotifier implements Notifier { notify(m: string) { console.log(m); } }

// Servicio que orquesta el pago
class PaymentService {
constructor(private policy: PaymentPolicy, private notifier: Notifier) {}
cobrar(p: Pasajero<any>, monto: number) {
if (this.policy.canCharge(p, monto)) {
this.policy.charge(p, monto);
this.notifier.notify(`${p.nombre} pagó ${monto}. Saldo restante: ${p.saldo}`);
} else {
this.notifier.notify(`${p.nombre} no tiene saldo suficiente.`);
}
}
}
**Impacto:** ahora soportamos fácilmente nuevas políticas (descuentos, prepago, validaciones) y distintos canales de notificación (console, UI, email) sin tocar Pasajero ni PaymentService.
###3.4 Tipos/Interfaces: Persona, Trabajador, Conductor
Son declaraciones de tipo y no contienen comportamiento. Cumplen SRP (son simples DTOs) y no aplican OCP en sentido estricto porque no contienen lógica; sin embargo, si se necesita comportamiento asociado (por ejemplo: calcularSalario()), conviene mover esa lógica a clases/servicios para cumplir SRP.
##4. Conclusiones Generales
Clases pequeñas y simples (como Contenedor y Vehiculo) son en general coherentes, pero hay mezcla entre modelo y salida a consola que reduce la reutilización y complica pruebas unitarias.
Pasajero mezcla estado y lógica de negocio/notificación: viola SRP y OCP en escenarios reales. Recomendación: extraer la lógica de pago a un PaymentService y usar políticas/estrategias (PaymentPolicy, Notifier).
Para OCP, la técnica recomendada es composición y dependencia de abstractions (interfaces) en vez de switch/if por tipo.
Para SRP, separar responsabilidades por capas: Modelo (datos), Servicios (orquestación y reglas), Repositorios (persistencia), Presentación/Formatters (salida).

3.4 Principio L (Liskov Substitution)

El Principio de Sustitución de Liskov (LSP) indica que las subclases deben poder reemplazar a sus superclases sin alterar el correcto funcionamiento del sistema. En otras palabras, cualquier objeto de una subclase debe poder ser utilizado en lugar de su clase padre, sin romper expectativas, contratos o causar errores inesperados.

src/models/Contenedor.ts — Contenedor

Diagnóstico LSP: Cumple.
Contenedor<T> no utiliza herencia, sino tipos genéricos. Al trabajar con T, cualquier tipo concreto (string, number, objetos) puede usarse de forma transparente, sin romper la lógica interna.

Ejemplo: Contenedor<number> y Contenedor<string> funcionan de la misma manera.

Riesgo: Nulo, ya que no hay jerarquías de clases en este caso.

src/models/Vehiculo.ts — Vehiculo

Diagnóstico LSP: Potencialmente cumple.
Actualmente Vehiculo es una clase base, pero no hay subclases implementadas. Si en el futuro se crean Bus, Taxi o Moto como subclases, deben comportarse de forma coherente:

Una instancia de Bus debería poder sustituir un Vehiculo en cualquier método que lo consuma (ej. mostrarVehiculoInfo(Vehiculo v)) sin que cambie el resultado esperado.

Riesgo: Si una subclase cambiara la semántica (por ejemplo, que Moto devuelva capacidad negativa o que Taxi.info() no muestre los datos básicos), se violaría LSP.

Refactor propuesto (si se crean subclases):
Separar la representación (Vehiculo) de la lógica de impresión (Formatter), asegurando que cualquier Bus o Taxi mantenga la misma estructura de contrato.

abstract class Vehiculo {
  constructor(public id: Id, public tipo: TipoVehiculo, public capacidad: number) {}
  abstract info(): string;
}

class Bus extends Vehiculo {
  info(): string {
    return `Bus [${this.id}] con capacidad de ${this.capacidad}`;
  }
}

class Taxi extends Vehiculo {
  info(): string {
    return `Taxi [${this.id}] capacidad ${this.capacidad}`;
  }
}

// Uso
const vehiculos: Vehiculo[] = [new Bus("BUS-1", "Bus", 40), new Taxi(101, "Taxi", 4)];
vehiculos.forEach(v => console.log(v.info())); // Cada uno sustituye correctamente a Vehiculo


Impacto: garantiza que todas las subclases cumplen el contrato de Vehiculo y que pueden usarse indistintamente.

src/models/Pasajero.ts — Pasajero

Diagnóstico LSP: Cumple, con observaciones.
Pasajero<T> está diseñado con genéricos, lo que permite extender extra con cualquier tipo (ejemplo: tarjeta, objeto con email). El contrato de la clase se respeta siempre, sin importar qué se pase en T.

Riesgo: Si en una futura extensión se define PasajeroVip extends Pasajero que cambia la lógica de pagar (por ejemplo, permitir saldo negativo o descuentos especiales), debe garantizar que no rompa las expectativas de los métodos que esperan un Pasajero normal.

Refactor propuesto (ejemplo de extensión compatible):

class PasajeroVip<T> extends Pasajero<T> {
  pagar(monto: number): void {
    // Descuento del 10% sin romper el contrato básico
    const montoFinal = monto * 0.9;
    if (this.saldo >= montoFinal) {
      this.saldo -= montoFinal;
      console.log(`${this.nombre} pagó con descuento $${montoFinal}. Saldo restante: ${this.saldo}`);
    } else {
      console.log(`${this.nombre} no tiene saldo suficiente.`);
    }
  }
}


Impacto: la subclase sigue cumpliendo el contrato (paga reduciendo saldo y notificando), pero añade un beneficio adicional sin romper la expectativa de que un pasajero puede pagar o no según su saldo.