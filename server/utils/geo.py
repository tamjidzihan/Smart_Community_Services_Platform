from geopy.distance import geodesic


def calculate_distance_km(lat1, lon1, lat2, lon2):
    """Return distance in km between two lat/lon pairs."""
    try:
        return geodesic((lat1, lon1), (lat2, lon2)).km
    except Exception:
        return 0.0


def build_geo_filter(queryset, lat, lon, radius_km, location_field='location'):
    """
    Filter a queryset to rows within radius_km of (lat, lon).
    Handles both direct 'latitude'/'longitude' attributes and Point objects.
    """
    results = []
    for obj in queryset:
        obj_lat = getattr(obj, 'latitude', None)
        obj_lon = getattr(obj, 'longitude', None)

        if obj_lat is not None and obj_lon is not None:
            dist = calculate_distance_km(lat, lon, float(obj_lat), float(obj_lon))
        elif location_field:
            loc = getattr(obj, location_field, None)
            if loc and hasattr(loc, 'y') and hasattr(loc, 'x'):
                dist = calculate_distance_km(lat, lon, loc.y, loc.x)
            elif isinstance(loc, dict) and 'lat' in loc and 'lng' in loc:
                dist = calculate_distance_km(lat, lon, loc['lat'], loc['lng'])
            else:
                obj._distance_km = None
                results.append(obj)
                continue
        else:
            obj._distance_km = None
            results.append(obj)
            continue

        if radius_km is None or dist <= radius_km:
            obj._distance_km = round(dist, 2)
            results.append(obj)

    results.sort(key=lambda x: getattr(x, '_distance_km', 0) if getattr(x, '_distance_km', None) is not None else 99999)
    return results
