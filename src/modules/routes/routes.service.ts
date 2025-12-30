import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from './Models/route.entity';
import { RouteStop } from './Models/route-stop.entity';
import { CreateRouteDto, SearchRoutesDto, AddStopDto } from './Dto';
import { EstadoRutaEnum } from './Enums';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(RouteStop)
    private readonly routeStopRepository: Repository<RouteStop>,
  ) {}

  /**
   * Calcula distancia entre dos puntos usando fórmula de Haversine
   * @returns distancia en kilómetros
   */
  private haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Crear una ruta
   */
  async createRoute(
    userId: string,
    dto: CreateRouteDto,
  ): Promise<{ message: string; routeId?: string }> {
    // TODO:
    // 1. Obtener driver a partir del userId (business_user -> driver)
    // 2. Validar que el driver esté APROBADO
    // 3. Validar rating >= 3.0
    // 4. Crear la ruta con estado ACTIVA
    // 5. Crear los route_stops ordenados

    return {
      message:
        'Ruta creada correctamente. La ruta queda activa y disponible para pasajeros cercanos.',
    };
  }

  /**
   * Obtener mis rutas como conductor
   */
  async getMyRoutes(
    userId: string,
    estado?: string,
  ): Promise<{ message: string; data?: Route[] }> {
    // TODO:
    // 1. Obtener driver del userId
    // 2. Filtrar rutas por driverId y opcionalmente por estado

    return {
      message: 'Listado de rutas creadas por el conductor.',
    };
  }

  /**
   * Buscar rutas disponibles cercanas usando Haversine
   */
  async getAvailableRoutes(
    dto: SearchRoutesDto,
  ): Promise<{ message: string; data?: Route[] }> {
    // TODO:
    // 1. Obtener todas las rutas ACTIVAS con asientos disponibles
    // 2. Para cada ruta, obtener sus stops
    // 3. Calcular distancia de cada stop al punto del pasajero
    // 4. Filtrar rutas que tengan al menos un stop dentro del radio
    // 5. Ordenar por distancia más cercana

    const radiusKm = dto.radiusKm || 1;

    return {
      message: 'Listado de rutas activas cercanas al pasajero según ubicación.',
    };
  }

  /**
   * Obtener detalle de una ruta
   */
  async getRouteById(
    routeId: string,
  ): Promise<{ message: string; data?: Route }> {
    // TODO: Buscar ruta con sus stops y datos del conductor

    return {
      message: 'Detalle de la ruta solicitada.',
    };
  }

  /**
   * Obtener coordenadas del mapa (solo stops)
   */
  async getRouteMap(
    routeId: string,
  ): Promise<{ message: string; stops?: RouteStop[] }> {
    // TODO:
    // 1. Buscar ruta
    // 2. Retornar stops ordenados con lat/lng/direccion
    // El frontend renderiza el mapa

    return {
      message: 'Coordenadas de la ruta para visualización en el mapa.',
    };
  }

  /**
   * Agregar parada intermedia
   */
  async addRouteStop(
    userId: string,
    routeId: string,
    dto: AddStopDto,
  ): Promise<{ message: string }> {
    // TODO:
    // 1. Validar que la ruta pertenezca al conductor
    // 2. Validar que la ruta esté ACTIVA
    // 3. Calcular orden óptimo del nuevo stop (usando Haversine)
    // 4. Reordenar stops existentes si es necesario
    // 5. Crear el nuevo stop

    return {
      message: 'Parada agregada a la ruta y trayecto recalculado.',
    };
  }

  /**
   * Cancelar una ruta
   */
  async cancelRoute(
    userId: string,
    routeId: string,
  ): Promise<{ message: string }> {
    // TODO:
    // 1. Validar que la ruta pertenezca al conductor
    // 2. Cambiar estado a CANCELADA
    // 3. Cancelar todos los bookings de la ruta
    // 4. Procesar reversiones de pago
    // 5. Registrar penalización al conductor

    return {
      message: 'Ruta cancelada correctamente.',
    };
  }

  /**
   * Finalizar una ruta
   */
  async finalizeRoute(
    userId: string,
    routeId: string,
  ): Promise<{ message: string }> {
    // TODO:
    // 1. Validar que la ruta pertenezca al conductor
    // 2. Validar que todos los bookings estén COMPLETADA o NO_SHOW
    // 3. Cambiar estado a FINALIZADA
    // La ruta ya no será visible para nadie

    return {
      message: 'Ruta finalizada. Ya no está disponible para pasajeros.',
    };
  }
}
