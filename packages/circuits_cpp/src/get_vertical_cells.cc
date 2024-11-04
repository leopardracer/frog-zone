#include "frogzone.h"

#pragma hls_top
CellDatas5 get_vertical_cells(
                          Coord player_coord,
                          Coord query_coord,
                          MonstersWithId monsters,
                          ItemsWithId items,
                          PlayersWithId players
                         ) {
  CellDatas5 cells;

  if ((query_coord.y != player_coord.y) || invalid_coord_x(player_coord, query_coord)) {
    #pragma hls_unroll yes
    for (int i = 0; i < 5; i++) {
      cells.values[i].entity_type = Invalid;
    }
    return cells;
  }

  Coord query_coords[5];
  query_coords[0].x = player_coord.x; query_coords[0].y = player_coord.y - 2;
  query_coords[1].x = player_coord.x; query_coords[1].y = player_coord.y - 1;
  query_coords[2].x = player_coord.x; query_coords[2].y = player_coord.y;
  query_coords[3].x = player_coord.x; query_coords[3].y = player_coord.y + 1;
  query_coords[4].x = player_coord.x; query_coords[4].y = player_coord.y + 2;

  #pragma hls_unroll yes
  for (int i = 0; i < 5; i++) {
    Coord query_coord = query_coords[i];
    cells.values[i] = get_cell_no_check(query_coord, monsters, items, players);
  }

  return cells;
}
