# Sistema de Transporte

Este proyecto es un sistema de transporte que utiliza TypeScript para gestionar diferentes tipos de vehículos y sus características. El objetivo es demostrar el uso de la intersección de tipos en TypeScript para combinar las propiedades y métodos de varios tipos en uno solo.

## Integrantes 
- Aslhy Casteblanco 
- Sarah Castro
- Maria Fer Rojas.
- Laura Arcila.

# Intersección de tipos

La intersección de tipos en TypeScript combina varios tipos en uno solo utilizando el operador &, creando un nuevo tipo que debe tener todas las propiedades y métodos de los tipos originales.
Por ejemplo, un tipo AdminUser resultante de la intersección de User y Admin tendrá las propiedades de ambos, requiriendo que un objeto cumpla con las características de ambos, de manera similar a cómo funcionan los conjuntos en matemáticas.


# ¿Cómo funciona?

El operador &: Se utiliza para unir dos o más tipos.

Combinación de características: El nuevo tipo resultante contiene una combinación de todas las características (propiedades y métodos) de los tipos que fueron intersectados.

Requisito de cumplimiento: Un objeto que tenga el tipo de intersección debe cumplir con todos los requisitos de cada uno de los tipos originales.

# Ejemplo practico 

Imagina que tienes dos tipos, Car y Electric, y quieres crear un tipo ElectricCar que sea ambos a la vez:

type Car = {
  brand: string;
  wheels: number;
};

type Electric = {
  batteryCapacity: number;
};

type ElectricCar = Car & Electric;


En este caso, una variable de tipo ElectricCar:

Debe tener una propiedad brand de tipo string y wheels de tipo number.

Y también debe tener una propiedad batteryCapacity de tipo number.

# ¿Cuándo usarlo?

Los tipos de intersección son útiles para:

Crear nuevos tipos a partir de otros existentes: Puedes construir tipos más complejos y específicos al combinar los rasgos de tipos más sencillos.

Representar objetos con múltiples roles: Un objeto puede tener características de diferentes orígenes o funcioness.