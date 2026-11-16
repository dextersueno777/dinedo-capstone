import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type RouteCoordinates = {
  latitude: number;
  longitude: number;
};

@Injectable()
export class MapboxDirectionsService {
  constructor(private readonly configService: ConfigService) {}

  async getDrivingRoute(
    origin: RouteCoordinates,
    destination: RouteCoordinates,
  ) {
    const token = this.configService
      .get<string>('MAPBOX_ACCESS_TOKEN')
      ?.trim();

    if (!token) {
      throw new ServiceUnavailableException(
        'Mapbox routing is not configured.',
      );
    }

    const coordinates =
      `${origin.longitude},${origin.latitude};` +
      `${destination.longitude},${destination.latitude}`;

    const url = new URL(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}`,
    );

    url.searchParams.set('overview', 'false');
    url.searchParams.set('steps', 'false');
    url.searchParams.set('access_token', token);

    const response = await fetch(url);

    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Unable to calculate delivery route.',
      );
    }

    const data = (await response.json()) as {
      routes?: Array<{
        distance?: number;
        duration?: number;
      }>;
    };

    const route = data.routes?.[0];

    if (typeof route?.distance !== 'number') {
      throw new ServiceUnavailableException(
        'Routing service did not return a valid distance.',
      );
    }

    return {
      distanceKm: Math.round((route.distance / 1000) * 1000) / 1000,
      durationSeconds:
        typeof route.duration === 'number' ? route.duration : null,
    };
  }
}
