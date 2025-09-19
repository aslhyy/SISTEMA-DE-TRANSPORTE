# Informe SOLID — Proyecto: Análisis TypeScript del repositorio

## 1. Contexto
Este informe analiza clases reales encontradas en el código fuente provisto para el proyecto Sistema de Transporte. El objetivo es verificar S (Single Responsibility), O (Open/Closed), L (Liskov Substitution), I (Interface Segregation) y D (Dependency Inversion) para cada clase, justificar con evidencia del código y, cuando haya conflictos, proponer refactors concretos (protótipos de código antes → después).

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

#### S (Single Responsibility)
**Diagnóstico:** Cumple parcialmente.
<br>
**Justificación:** Contenedor<T> implementa únicamente métodos relacionados con la gestión de la colección (agregar, obtenerPrimero, mostrarTodos). Estas operaciones pertenecen al mismo motivo de cambio: la forma en que se almacenan/recuperan elementos en memoria. No hay mezcla con persistencia externa ni lógica de negocio adicional.
<br>
**Riesgo si se mantiene así:** Bajo. La clase es pequeña y testeable. Si se añadiera lógica de persistencia (ej. guardar en DB) o validación de elementos, entonces rompería SRP.
#### O (Open/Closed)
**Diagnóstico:** No cumple totalmente (abierta a extensión limitada).
**Justificación:** Actualmente la clase no está preparada para extender comportamiento (por ejemplo: validación al agregar, notificaciones, persistencia alternativa) sin modificarla. Cualquier nueva política (filtrado, logging, persistencia) obligaría a cambiar Contenedor.
#### Refactor propuesto (antes → después)
// Antes
<pre>
class Contenedor<T> {
private items: T[] = [];
agregar(item: T): void { this.items.push(item); console.log("Agregado:", item); }
obtenerPrimero(): T | undefined { return this.items[0]; }
mostrarTodos(): void { console.log("Contenido:", this.items); }
}
</pre>
<pre>
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
</pre>
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
Principio de Segregación de Interfaces (ISP)

El Interface Segregation Principle (ISP) es el cuarto de los principios SOLID.
Su enunciado dice:

“Los clientes no deberían estar obligados a depender de interfaces que no utilizan”.

En palabras simples:
👉 Es mejor tener varias interfaces pequeñas y específicas que una interfaz gigante que obligue a implementar cosas innecesarias.

🚫 Ejemplo Incorrecto (rompe ISP)

En este caso, tenemos una interfaz demasiado grande llamada UsuarioSistema.
Todos los tipos de usuarios del sistema (Pasajero, Conductor, etc.) estarían obligados a implementar propiedades que no necesitan.

// Una interfaz demasiado grande
interface UsuarioSistema {
  nombre: string;
  salario: number;   // ❌ no todos tienen salario
  licencia: string;  // ❌ no todos tienen licencia
  saldo: number;     // ❌ no todos pagan con saldo
}


🔴 Problemas:

Un Pasajero no debería tener que declarar salario ni licencia.

Un Conductor no debería tener que declarar saldo.

Se viola el principio ISP porque los clientes dependen de cosas que no usan.
// Interfaces pequeñas y específicas
interface Persona {
  nombre: string;
}

interface Trabajador {
  salario: number;
}

interface LicenciaConduccion {
  licencia: string;
}

interface UsuarioSaldo {
  saldo: number;
}

// Composición para armar roles
type Conductor = Persona & Trabajador & LicenciaConduccion;
type Pasajero = Persona & UsuarioSaldo;
De esta forma, cada rol depende solo de lo que realmente necesita.

Uso en las Clases
ts
Copiar código
// Pasajero con ISP
class PasajeroImpl implements Pasajero {
  nombre: string;
  saldo: number;

  constructor(nombre: string, saldo: number) {
    this.nombre = nombre;
    this.saldo = saldo;
  }

  pagar(monto: number): void {
    if (this.saldo >= monto) {
      this.saldo -= monto;
      console.log(${this.nombre} pagó $${monto}. Saldo restante: ${this.saldo});
    } else {
      console.log(${this.nombre} no tiene saldo suficiente.);
    }
  }
}

// Conductor con ISP
class ConductorImpl implements Conductor {
  nombre: string;
  salario: number;
  licencia: string;

  constructor(nombre: string, salario: number, licencia: string) {
    this.nombre = nombre;
    this.salario = salario;
    this.licencia = licencia;
  }

  info(): void {
    console.log(Conductor: ${this.nombre}, Salario: ${this.salario}, Licencia: ${this.licencia});
  }
}✅ Ventajas de aplicar ISP

Pasajero solo depende de nombre y saldo.

Conductor solo depende de nombre, salario y licencia.

Si se agrega un nuevo rol (ej. Inspector), podemos componerlo con las interfaces que necesite, sin heredar propiedades innecesarias.

📌 Conclusión:
El Principio de Segregación de Interfaces nos ayuda a evitar interfaces infladas y a mantener la flexibilidad en el diseño.
Cada clase o rol en el sistema solo implementa lo que realmente necesita, ni más ni menos.

3.5 Principio D (Dependency Inversion)

El Principio de Inversión de Dependencias establece dos reglas clave:

Los módulos de alto nivel no deben depender de módulos de bajo nivel, sino de abstracciones.

Las abstracciones no deben depender de los detalles, sino que los detalles deben depender de las abstracciones.

El objetivo es reducir el acoplamiento, permitir intercambiar implementaciones sin modificar el código principal y hacer el sistema más flexible y testeable.

src/models/Contenedor.ts — Contenedor

Diagnóstico DIP: No cumple totalmente.
Actualmente Contenedor depende de detalles concretos como console.log dentro de sus métodos (agregar, mostrarTodos). Esto genera un acoplamiento fuerte con la forma de salida.

Problema: Si mañana se necesita mostrar los datos en una UI web o guardar en un archivo, habría que modificar Contenedor.

Impacto: Reduce testabilidad y reutilización.

Refactor propuesto (uso de abstracciones para notificación):

interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(message);
  }
}

class Contenedor<T> {
  private items: T[] = [];
  constructor(private logger: Logger) {}

  agregar(item: T): void {
    this.items.push(item);
    this.logger.log(`Agregado: ${item}`);
  }

  obtenerPrimero(): T | undefined {
    return this.items[0];
  }

  mostrarTodos(): void {
    this.logger.log(`Contenido: ${this.items}`);
  }
}


Impacto: Contenedor ya no depende de console.log directamente, sino de la abstracción Logger. Cambiar de consola a archivo, base de datos o UI sería cuestión de proveer otra implementación de Logger.

src/models/Vehiculo.ts — Vehiculo

Diagnóstico DIP: No cumple completamente.
El método info() imprime directamente a la consola. Esto mezcla el modelo de datos con la dependencia concreta de IO.

Problema: No es posible reutilizar Vehiculo en otros contextos (API, interfaz gráfica, reportes) sin modificar la clase.

Refactor propuesto (separar el formato y la salida):

interface VehiculoFormatter {
  format(v: Vehiculo): string;
}

class ConsoleVehiculoFormatter implements VehiculoFormatter {
  format(v: Vehiculo): string {
    return `Vehiculo: [${v.id}] - Tipo: ${v.tipo}, Capacidad: ${v.capacidad}`;
  }
}

class Vehiculo {
  constructor(public id: Id, public tipo: TipoVehiculo, public capacidad: number) {}
}

// Uso
const formatter = new ConsoleVehiculoFormatter();
const bus = new Vehiculo("BUS-123", "Bus", 50);
console.log(formatter.format(bus));


Impacto: la clase Vehiculo queda limpia, y el detalle de cómo se formatea o dónde se imprime depende de una abstracción (VehiculoFormatter), no del modelo.

src/models/Pasajero.ts — Pasajero

Diagnóstico DIP: No cumple.
En el método pagar, Pasajero depende de console.log para notificar el resultado del pago. Esto fuerza a que toda comunicación sea por consola.

Problema: No se puede reutilizar la lógica de pago en un sistema real (app móvil, web, logs en base de datos) sin modificar la clase.

Refactor propuesto (invertir dependencias con Notifier y PaymentPolicy):

interface Notifier {
  notify(message: string): void;
}

class ConsoleNotifier implements Notifier {
  notify(message: string): void {
    console.log(message);
  }
}

interface PaymentPolicy {
  canCharge(p: Pasajero<any>, amount: number): boolean;
  charge(p: Pasajero<any>, amount: number): void;
}

class DefaultPaymentPolicy implements PaymentPolicy {
  canCharge(p: Pasajero<any>, amount: number): boolean {
    return p.saldo >= amount;
  }
  charge(p: Pasajero<any>, amount: number): void {
    p.saldo -= amount;
  }
}

class Pasajero<T> {
  constructor(public nombre: string, public saldo: number, public extra: T, private notifier: Notifier, private policy: PaymentPolicy) {}

  pagar(monto: number): void {
    if (this.policy.canCharge(this, monto)) {
      this.policy.charge(this, monto);
      this.notifier.notify(`${this.nombre} pagó $${monto}. Saldo restante: ${this.saldo}`);
    } else {
      this.notifier.notify(`${this.nombre} no tiene saldo suficiente.`);
    }
  }
}


Impacto: Pasajero ya no depende de detalles concretos. Tanto la forma de notificación (consola, UI, archivo, API) como la política de cobro (normal, descuento, saldo negativo permitido) se inyectan como dependencias externas y abstraídas.
