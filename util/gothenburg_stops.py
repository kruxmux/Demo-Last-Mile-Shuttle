import json


def unique_name(stop_names, new_name):
    """Add new stop to set and check if new_name is unique"""
    len_before = len(stop_names)
    stop_names.add(new_name)
    if len_before == len(stop_names):
        return stop_names, False
    return stop_names, True


def filter_gothenburg():
    stops_file = open("stops.txt")
    stops_lines = stops_file.readlines()
    stops = []
    gothenburg_file = open("gothenburg_stops.txt", "w")

    stop_names = set()
    for line in stops_lines:
        if "Göteborg" in line:
            splitted = line.split(",")
            #print(splitted)
            if "S" in splitted[0]:  # ignore platforms
                # remove quotation from stop name
                name = splitted[2][1:]

                # Only add first platform of a stop
                stop_names, unique = unique_name(stop_names, name)
                if unique:
                    lat = float(splitted[5])
                    lng = float(splitted[6])

                    stops.append({"name": name, "coords": [lat, lng]})
                    gothenburg_file.write(line)

    return stops


stops = filter_gothenburg()
with open("gothenburg_stops.json", "w") as stops_file:
    json.dump(stops, stops_file)
