import Svg, { Path } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
  filled?: boolean;
};

export function SearchIcon({
  size = 24,
  color = "#000",
  filled = false,
}: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      {filled ? (
        <Path
          fill={color}
          d="M10 2a8 8 0 015.293 13.707l5.5 5.5a1 1 0 01-1.414 1.414l-5.5-5.5A8 8 0 1110 2zm0 2a6 6 0 100 12 6 6 0 000-12z"
        />
      ) : (
        <Path
          fill={color}
          d="M23.707 22.293l-5.969-5.969a10.016 10.016 0 10-1.414 1.414l5.969 5.969a1 1 0 001.414-1.414zM10 18a8 8 0 118-8 8.009 8.009 0 01-8 8z"
        />
      )}
    </Svg>
  );
}

export function HomeIcon({
  size = 24,
  color = "#000",
  filled = false,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {filled ? (
        // Versión SÓLIDA - casa rellena con puerta como hueco
        <Path
          fill={color}
          fillRule="evenodd"
          d="M79.167 87.5H20.833c-4.596 0-8.333-3.739-8.333-8.333V51.725a8.28 8.28 0 012.441-5.892L47.054 13.72a4.165 4.165 0 015.892 0l32.113 32.113a8.275 8.275 0 012.441 5.892v27.441c0 4.595-3.739 8.334-8.333 8.334zM45.833 54.167c-4.596 0-8.333 3.739-8.333 8.333v25h25v-25c0-4.594-3.739-8.333-8.333-8.333h-8.334z"
        />
      ) : (
        // Versión OUTLINE - casa con contorno y hueco
        <Path
          fill={color}
          d="M79.167 87.5H58.333a4.165 4.165 0 01-4.167-4.167V62.5h-8.333v20.833a4.166 4.166 0 01-4.167 4.167H20.833c-4.596 0-8.333-3.739-8.333-8.333V51.725a8.28 8.28 0 012.441-5.892L47.054 13.72a4.165 4.165 0 015.892 0l32.113 32.113a8.275 8.275 0 012.441 5.892v27.441c0 4.595-3.739 8.334-8.333 8.334zM62.5 79.167h16.667V51.725L50 22.559 20.833 51.725v27.441H37.5V62.5c0-4.594 3.737-8.333 8.333-8.333h8.333c4.594 0 8.333 3.739 8.333 8.333v16.667z"
        />
      )}
    </Svg>
  );
}

export function FavoritesIcon({
  size = 24,
  color = "#000",
  filled = false,
}: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      {filled ? (
        // Versión SÓLIDA - estrella rellena
        <Path
          fill={color}
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      ) : (
        // Versión OUTLINE - estrella con contorno
        <Path
          fill={color}
          d="M23.836 8.794a3.179 3.179 0 00-3.067-2.226H16.4l-1.327-4.136a3.227 3.227 0 00-6.146 0L7.6 6.568H3.231a3.227 3.227 0 00-1.9 5.832L4.887 15l-1.352 4.187A3.178 3.178 0 004.719 22.8a3.177 3.177 0 003.8-.019L12 20.219l3.482 2.559a3.227 3.227 0 004.983-3.591L19.113 15l3.56-2.6a3.177 3.177 0 001.163-3.606zm-2.343 1.991l-4.144 3.029a1 1 0 00-.362 1.116l1.575 4.87a1.227 1.227 0 01-1.895 1.365l-4.075-3a1 1 0 00-1.184 0l-4.075 3a1.227 1.227 0 01-1.9-1.365l1.58-4.87a1 1 0 00-.362-1.116l-4.144-3.029a1.227 1.227 0 01.724-2.217h5.1a1 1 0 00.952-.694l1.55-4.831a1.227 1.227 0 012.336 0l1.55 4.831a1 1 0 00.952.694h5.1a1.227 1.227 0 01.724 2.217z"
        />
      )}
    </Svg>
  );
}
export function ObraIcon({ size = 24, color = "#000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M21.5 0H13v7h11V2.5C24 1.122 22.879 0 21.5 0zM23 6h-9V1h7.5c.827 0 1.5.673 1.5 1.5V6zM8 5H2.5A2.503 2.503 0 000 7.5V24h24V11H8V5zM1 7.5C1 6.673 1.673 6 2.5 6H7v5H1V7.5zM1 18h6v5H1v-5zm15 0v5H8v-5h8zm1 5v-5h6v5h-6zm6-6H12.5v-5H23v5zm-11.5-5v5H1v-5h10.5z"
        fill={color}
      />
    </Svg>
  );
}
