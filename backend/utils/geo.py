from geopy.distance import geodesic


def calculate_distance_km(lat1, lon1, lat2, lon2):
    """Return distance in km between two lat/lon pairs."""
    return geodesic((lat1, lon1), (lat2, lon2)).km


def build_geo_filter(queryset, lat, lon, radius_km, location_field='location'):
    """
    Filter a queryset to rows within radius_km of (lat, lon).
    Uses raw distance approximation via annotate for non-PostGIS setups,
    or falls back to Python-side filtering.
    """
    results = []
    for obj in queryset:
        loc = getattr(obj, location_field, None)
        if loc and hasattr(loc, 'y') and hasattr(loc, 'x'):
            dist = calculate_distance_km(lat, lon, loc.y, loc.x)
        elif isinstance(loc, dict):
            dist = calculate_distance_km(lat, lon, loc['lat'], loc['lng'])
        else:
            continue
        if dist <= radius_km:
            obj._distance_km = round(dist, 2)
            results.append(obj)
    results.sort(key=lambda x: x._distance_km)
    return results
