import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Snake404Game.css';

// --- CONFIGURACIÓN ESTÁTICA ---
const CELL_SIZE = 20; // Tamaño de cada celda en píxeles
const INITIAL_SPEED = 25; 

// Configuramos la serpiente inicial con 3 segmentos (ej. centrada, moviéndose a la derecha)
const INITIAL_SNAKE = [
    { x: 10, y: 10 }, // Cabeza
    { x: 9, y: 10 },  // Segmento 2
    { x: 8, y: 10 }   // Segmento 3
];
const INITIAL_DIRECTION = { x: 1, y: 0 }; 

// --- COMPONENTE PRINCIPAL ---
const Snake404Game = () => {
    // Estado dinámico de la cuadrícula
    const [gridSizeX, setGridSizeX] = useState(0);
    const [gridSizeY, setGridSizeY] = useState(0);

    // Estado del juego
    const [snake, setSnake] = useState(INITIAL_SNAKE);
    const [food, setFood] = useState(null); 
    const [score, setScore] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    
    // Usamos ref para la dirección
    const directionRef = useRef(INITIAL_DIRECTION); 
    const gameRef = useRef(null); 

    // --- FUNCIÓN DE UTILIDAD: Generar Comida ---
    const generateFood = useCallback((currentSnake, maxX, maxY) => {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * maxX),
                y: Math.floor(Math.random() * maxY),
            };
        } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        return newFood;
    }, []);
    
    // --- LÓGICA: Ajustar Tamaño y Reiniciar ---
    const resetGame = useCallback((maxX, maxY) => {
        // Usa los valores de cuadrícula pasados, o los del estado si están disponibles
        const finalMaxX = maxX > 0 ? maxX : gridSizeX;
        const finalMaxY = maxY > 0 ? maxY : gridSizeY;
        
        if (finalMaxX === 0 || finalMaxY === 0) return;

        setSnake(INITIAL_SNAKE);
        setFood(generateFood(INITIAL_SNAKE, finalMaxX, finalMaxY));
        directionRef.current = INITIAL_DIRECTION;
        setScore(0);
        setIsPaused(false);
    }, [generateFood, gridSizeX, gridSizeY]);

    // LÓGICA: Calcular el tamaño de la cuadrícula al montar y redimensionar
    useEffect(() => {
        const calculateGridSize = () => {
            // Obtenemos el tamaño del viewport (100vw/100vh)
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Calculamos cuántas celdas caben
            const newGridSizeX = Math.floor(width / CELL_SIZE);
            const newGridSizeY = Math.floor(height / CELL_SIZE);
            
            setGridSizeX(newGridSizeX);
            setGridSizeY(newGridSizeY);

            // Si es la primera vez (food es null) o el tamaño cambia drásticamente, inicializamos/reiniciamos
            if (!food || food.x >= newGridSizeX || food.y >= newGridSizeY) {
                 // Regeneramos o inicializamos el juego con las nuevas dimensiones
                 resetGame(newGridSizeX, newGridSizeY);
            }
        };

        calculateGridSize();
        window.addEventListener('resize', calculateGridSize);
        
        return () => window.removeEventListener('resize', calculateGridSize);
    }, [food, resetGame]);

    // --- LÓGICA: Movimiento Principal de la Serpiente (con Teletransporte) ---
    const moveSnake = useCallback(() => {
        if (isPaused || gridSizeX === 0 || gridSizeY === 0 || !food) return;

        const currentDirection = directionRef.current;
        
        // 1. Calcular la nueva cabeza
        let newHead = {
            x: snake[0].x + currentDirection.x,
            y: snake[0].y + currentDirection.y,
        };

        // 2. Colisión "Chill": La serpiente se teletransporta (Wraps around)
        newHead.x = (newHead.x + gridSizeX) % gridSizeX;
        newHead.y = (newHead.y + gridSizeY) % gridSizeY;

        // 3. Colisión (Consigo mismo)
        if (snake.some((segment, index) => index !== 0 && segment.x === newHead.x && segment.y === newHead.y)) {
            resetGame();
            return;
        }

        // Crear el nuevo cuerpo de la serpiente
        const newSnake = [newHead, ...snake];

        // 4. Detección de Comida
        if (newHead.x === food.x && newHead.y === food.y) {
            setScore(prevScore => prevScore + 1);
            setFood(generateFood(newSnake, gridSizeX, gridSizeY));
            // La serpiente crece (no eliminamos la cola)
        } else {
            // La serpiente se mueve (eliminamos la cola)
            newSnake.pop();
        }

        setSnake(newSnake);
    }, [snake, food, isPaused, gridSizeX, gridSizeY, generateFood, resetGame]);


    // --- LÓGICA: Bucle del Juego (Intervalo) ---
    useEffect(() => {
        if (gridSizeX === 0 || gridSizeY === 0 || isPaused) return;

        const speed = INITIAL_SPEED - (score * 2); 
        
        const gameLoop = setInterval(moveSnake, Math.max(speed, 60)); 

        return () => clearInterval(gameLoop); 
    }, [moveSnake, gridSizeX, gridSizeY, isPaused, score]);

    // --- LÓGICA: Manejar Teclas de Dirección ---
    const handleKeyDown = useCallback((event) => {
        const currentDir = directionRef.current;

        switch (event.key) {
            case 'ArrowUp':
                if (currentDir.y === 0) { directionRef.current = { x: 0, y: -1 }; }
                break;
            case 'ArrowDown':
                if (currentDir.y === 0) { directionRef.current = { x: 0, y: 1 }; }
                break;
            case 'ArrowLeft':
                if (currentDir.x === 0) { directionRef.current = { x: -1, y: 0 }; }
                break;
            case 'ArrowRight':
                if (currentDir.x === 0) { directionRef.current = { x: 1, y: 0 }; }
                break;
            default:
                break;
        }
    }, []);

    // --- LÓGICA: Escuchador de Eventos de Teclado ---
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
    

    // --- RENDERIZADO ---
    if (gridSizeX === 0 || gridSizeY === 0) {
        return <div className="loading-screen">Cargando Mapa...</div>;
    }

    return (
        <div 
            className="snake-404-container"
            ref={gameRef}
            style={{ 
                '--cell-size': `${CELL_SIZE}px`,
                '--grid-size-x': gridSizeX,
                '--grid-size-y': gridSizeY,
                width: '100vw', // Aseguramos que ocupe todo el ancho
                height: '100vh', // Aseguramos que ocupe todo el alto
            }}
        >
            {/* --- CAPA DE TEXTO Y BOTONES (Frente) --- */}
            <div className="overlay-content">
                <div className="text-display">
                    <h1>404</h1>
                    <h2>Página no Encontrada</h2>
                    <p>Parece que te perdiste. Usa las **flechas** para jugar o regresa al inicio.</p>
                    <p className="score-display">Puntuación: **{score}**</p>
                </div>
                
                <div className="buttons-container">
                    <button 
                        onClick={() => window.history.back()} 
                        className="action-button"
                    >
                        [Volver]
                    </button>
                    <button 
                        onClick={() => window.location.href = '/'} 
                        className="action-button"
                    >
                        [Regresar al inicio]
                    </button>
                    <button 
                        onClick={() => resetGame(gridSizeX, gridSizeY)} 
                        className="action-button reset-button"
                    >
                        [Reiniciar Juego]
                    </button>
                </div>
            </div>

            {/* --- CAPA DEL JUEGO (Detrás del Texto) --- */}
            <div className="game-elements-container">
                <div className="grid-background" />

                {/* Renderizar la Serpiente */}
                {snake.map((segment, index) => (
                    <div
                        key={index}
                        className={`snake-segment ${index === 0 ? 'snake-head' : ''}`}
                        style={{
                            // Usamos transform para un rendimiento de renderizado mejor
                            transform: `translate(${segment.x * CELL_SIZE}px, ${segment.y * CELL_SIZE}px)`,
                        }}
                    />
                ))}

                {/* Renderizar la Comida (solo si existe) */}
                {food && (
                    <div
                        className="food"
                        style={{
                            transform: `translate(${food.x * CELL_SIZE}px, ${food.y * CELL_SIZE}px)`,
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default Snake404Game;