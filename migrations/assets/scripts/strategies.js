// Strategies Page JavaScript - Interactive Hockey Plays Visualization
document.addEventListener('DOMContentLoaded', () => {
    const strategyData = {
        // --- Plus Utilisées ---
        power_skating: {
            title: 'Patinage de puissance (Carres, croisements)',
            players: [
                { type: 'o', y: '20%', x: '15%', label: 'O' },
                { type: 'o', y: '30%', x: '15%', label: 'O' },
                { type: 'o', y: '40%', x: '15%', label: 'O' },
                { type: 'o', y: '60%', x: '15%', label: 'O' },
                { type: 'o', y: '70%', x: '15%', label: 'O' },
                { type: 'o', y: '80%', x: '15%', label: 'O' }
            ]
        },
        passing_drills: {
            title: 'Exercices de passes (Donne-et-va)',
            players: [
                { type: 'o', y: '30%', x: '70%', label: 'O' },
                { type: 'o', y: '70%', x: '70%', label: 'O' },
                { type: 'puck', y: '35%', x: '70%', label: 'P' }
            ]
        },
        shooting_drills: {
            title: 'Ateliers de tirs (Poignets, réception)',
            players: [
                { type: 'o', y: '50%', x: '65%', label: 'O' },
                { type: 'o', y: '20%', x: '35%', label: 'O' },
                { type: 'puck', y: '25%', x: '35%', label: 'P' },
                { type: 'puck', y: '30%', x: '35%', label: 'P' }
            ]
        },
        breakouts: {
            title: 'Sorties de zone (Breakouts) de base',
            players: [
                { type: 'o', y: '80%', x: '15%', label: 'D' },
                { type: 'o', y: '80%', x: '30%', label: 'A' },
                { type: 'o', y: '50%', x: '40%', label: 'C' },
                { type: 'puck', y: '85%', x: '15%', label: 'P' }
            ]
        },
        forecheck_122: {
            title: 'Échec-avant (Forecheck) (1-2-2)',
            players: [
                { type: 'o', y: '50%', x: '80%', label: 'F1' },
                { type: 'o', y: '30%', x: '65%', label: 'F2' },
                { type: 'o', y: '70%', x: '65%', label: 'F3' },
                { type: 'o', y: '20%', x: '55%', label: 'D1' },
                { type: 'o', y: '80%', x: '55%', label: 'D2' },
                { type: 'x', y: '50%', x: '15%', label: 'X' },
                { type: 'puck', y: '50%', x: '10%', label: 'P' }
            ]
        },
        d_zone_coverage: {
            title: 'Couverture en zone défensive',
            players: [
                { type: 'o', y: '50%', x: '15%', label: 'D' },
                { type: 'o', y: '80%', x: '20%', label: 'D' },
                { type: 'o', y: '70%', x: '30%', label: 'A' },
                { type: 'o', y: '30%', x: '30%', label: 'A' },
                { type: 'o', y: '20%', x: '40%', label: 'C' },
                { type: 'x', y: '85%', x: '15%', label: 'X' },
                { type: 'puck', y: '90%', x: '10%', label: 'P' }
            ]
        },
        pp_umbrella: {
            title: 'Power Play "Umbrella" (1-3-1)',
            players: [
                { type: 'o', y: '50%', x: '65%', label: 'O' },
                { type: 'o', y: '15%', x: '75%', label: 'O' },
                { type: 'o', y: '85%', x: '75%', label: 'O' },
                { type: 'o', y: '50%', x: '35%', label: 'O' },
                { type: 'o', y: '50%', x: '90%', label: 'O' },
                { type: 'x', y: '30%', x: '85%', label: 'X' },
                { type: 'x', y: '70%', x: '85%', label: 'X' },
                { type: 'x', y: '35%', x: '70%', label: 'X' },
                { type: 'x', y: '65%', x: '70%', label: 'X' }
            ]
        },
        pk_box: {
            title: 'Désavantage numérique (Penalty Kill) (Boîte)',
            players: [
                { type: 'x', y: '30%', x: '85%', label: 'X' },
                { type: 'x', y: '70%', x: '85%', label: 'X' },
                { type: 'x', y: '35%', x: '70%', label: 'X' },
                { type: 'x', y: '65%', x: '70%', label: 'X' }
            ]
        },
        small_area_games: {
            title: 'Jeux en espace restreint (3v3, 2v2)',
            players: [
                { type: 'o', y: '70%', x: '80%', label: 'O' },
                { type: 'o', y: '85%', x: '70%', label: 'O' },
                { type: 'x', y: '80%', x: '75%', label: 'X' },
                { type: 'x', y: '75%', x: '85%', label: 'X' },
                { type: 'puck', y: '90%', x: '90%', label: 'P' }
            ]
        },
        flow_drills: {
            title: "Échauffements 'Flow drills' (en flot)",
            players: [
                { type: 'o', y: '20%', x: '15%', label: 'O' },
                { type: 'o', y: '50%', x: '35%', label: 'O' },
                { type: 'o', y: '80%', x: '15%', label: 'O' },
                { type: 'puck', y: '25%', x: '15%', label: 'P' }
            ]
        },
        // --- À Éviter ---
        long_lines: {
            title: 'À Éviter: Longues files d\'attente',
            players: [
                { type: 'o', y: '80%', x: '20%', label: 'O' },
                { type: 'o', y: '82%', x: '18%', label: 'O' },
                { type: 'o', y: '84%', x: '16%', label: 'O' },
                { type: 'o', y: '86%', x: '14%', label: 'O' },
                { type: 'o', y: '88%', x: '12%', label: 'O' },
                { type: 'o', y: '90%', x: '10%', label: 'O' }
            ]
        },
        bag_skates: {
            title: 'À Éviter: Patinage punitif ("Bag skates")',
            players: [
                { type: 'o', y: '50%', x: '15%', label: 'O' },
                { type: 'o', y: '50%', x: '25%', label: 'O' },
                { type: 'o', y: '50%', x: '35%', label: 'O' }
            ]
        },
        no_puck_drills: {
            title: 'À Éviter: Exercices sans rondelle (trop fréquents)',
            players: [
                { type: 'o', y: '20%', x: '20%', label: 'O' },
                { type: 'o', y: '80%', x: '20%', label: 'O' },
                { type: 'o', y: '20%', x: '80%', label: 'O' },
                { type: 'o', y: '80%', x: '80%', label: 'O' }
            ]
        },
        ignore_goalies: {
            title: 'À Éviter: Ignorer les gardiens',
            players: [
                { type: 'o', y: '50%', x: '50%', label: 'G' }
            ]
        },
        overly_complex: {
            title: 'À Éviter: Exercices trop compliqués',
            players: [
                { type: 'o', y: '20%', x: '20%', label: '?' },
                { type: 'o', y: '80%', x: '20%', label: '?' },
                { type: 'o', y: '20%', x: '80%', label: '?' },
                { type: 'o', y: '80%', x: '80%', label: '?' }
            ]
        },
        no_progression: {
            title: 'À Éviter: Manque de progression',
            players: [
                { type: 'o', y: '50%', x: '40%', label: 'O' },
                { type: 'o', y: '50%', x: '60%', label: 'O' }
            ]
        },
        ignore_weak_side: {
            title: 'À Éviter: Ignorer le jeu "côté faible"',
            players: [
                { type: 'o', y: '80%', x: '80%', label: 'O' },
                { type: 'o', y: '20%', x: '75%', label: 'O' },
                { type: 'puck', y: '85%', x: '85%', label: 'P' }
            ]
        },
        no_why: {
            title: 'À Éviter: Ne pas expliquer le "Pourquoi"',
            players: [
                { type: 'o', y: '50%', x: '50%', label: '?' }
            ]
        },
        end_on_failure: {
            title: 'À Éviter: Terminer sur un échec',
            players: [
                { type: 'o', y: '50%', x: '50%', label: ':(' }
            ]
        },
        full_scrimmage: {
            title: 'À Éviter: Partie complète tout le temps',
            players: [
                { type: 'o', y: '30%', x: '40%', label: 'O' },
                { type: 'o', y: '70%', x: '40%', label: 'O' },
                { type: 'x', y: '30%', x: '60%', label: 'X' },
                { type: 'x', y: '70%', x: '60%', label: 'X' }
            ]
        },
        // --- À Revoir ---
        neutral_zone_trap: {
            title: 'À Revoir: Regroupement (Trap) 1-3-1',
            players: [
                { type: 'o', y: '50%', x: '60%', label: 'F1' },
                { type: 'o', y: '20%', x: '50%', label: 'F2' },
                { type: 'o', y: '50%', x: '50%', label: 'F3' },
                { type: 'o', y: '80%', x: '50%', label: 'D1' },
                { type: 'o', y: '50%', x: '35%', label: 'D2' }
            ]
        },
        zone_entries: {
            title: 'À Revoir: Entrées de zone',
            players: [
                { type: 'o', y: '50%', x: '45%', label: 'O' },
                { type: 'o', y: '20%', x: '55%', label: 'O' },
                { type: 'o', y: '80%', x: '55%', label: 'O' },
                { type: 'x', y: '30%', x: '65%', label: 'X' },
                { type: 'x', y: '70%', x: '65%', label: 'X' },
                { type: 'puck', y: '55%', x: '45%', label: 'P' }
            ]
        },
        faceoffs: {
            title: 'À Revoir: Mises au jeu (Offensives)',
            players: [
                { type: 'o', y: '26%', x: '82%', label: 'C' },
                { type: 'o', y: '20%', x: '75%', label: 'A' },
                { type: 'o', y: '20%', x: '65%', label: 'D' },
                { type: 'x', y: '20%', x: '82%', label: 'X' }
            ]
        },
        attack_6v5: {
            title: 'À Revoir: Attaque à 6-contre-5',
            players: [
                { type: 'o', y: '50%', x: '90%', label: 'O' },
                { type: 'o', y: '20%', x: '80%', label: 'O' },
                { type: 'o', y: '80%', x: '80%', label: 'O' },
                { type: 'o', y: '50%', x: '65%', label: 'O' },
                { type: 'o', y: '20%', x: '35%', label: 'O' },
                { type: 'o', y: '80%', x: '35%', label: 'O' }
            ]
        },
        game_6v5_delayed: {
            title: 'À Revoir: Jeu à 6-contre-5 (Punition différée)',
            players: [
                { type: 'o', y: '50%', x: '90%', label: 'O' },
                { type: 'o', y: '20%', x: '80%', label: 'O' },
                { type: 'o', y: '80%', x: '80%', label: 'O' },
                { type: 'o', y: '50%', x: '65%', label: 'O' },
                { type: 'o', y: '20%', x: '35%', label: 'O' },
                { type: 'o', y: '80%', x: '35%', label: 'O' }
            ]
        },
        net_front_screens: {
            title: 'À Revoir: Écrans devant le filet',
            players: [
                { type: 'o', y: '50%', x: '88%', label: 'O' },
                { type: 'o', y: '50%', x: '35%', label: 'D' },
                { type: 'x', y: '50%', x: '85%', label: 'X' },
                { type: 'puck', y: '50%', x: '40%', label: 'P' }
            ]
        },
        cycling: {
            title: 'À Revoir: Protection (Cycling)',
            players: [
                { type: 'o', y: '85%', x: '85%', label: 'O' },
                { type: 'o', y: '75%', x: '75%', label: 'O' },
                { type: 'x', y: '80%', x: '80%', label: 'X' },
                { type: 'puck', y: '90%', x: '90%', label: 'P' }
            ]
        },
        d_stick_position: {
            title: 'À Revoir: Positionnement défensif du bâton',
            players: [
                { type: 'x', y: '50%', x: '70%', label: 'X' },
                { type: 'o', y: '20%', x: '80%', label: 'O' },
                { type: 'o', y: '80%', x: '80%', label: 'O' }
            ]
        },
        read_forecheck: {
            title: 'À Revoir: Lecture de l\'échec-avant (D-à-D)',
            players: [
                { type: 'o', y: '30%', x: '15%', label: 'D1' },
                { type: 'o', y: '70%', x: '15%', label: 'D2' },
                { type: 'x', y: '30%', x: '25%', label: 'F1' },
                { type: 'puck', y: '35%', x: '15%', label: 'P' }
            ]
        },
        transition_counter: {
            title: 'À Revoir: Transition et contre-attaque',
            players: [
                { type: 'o', y: '50%', x: '30%', label: 'D' },
                { type: 'o', y: '30%', x: '40%', label: 'A' },
                { type: 'o', y: '70%', x: '40%', label: 'A' },
                { type: 'puck', y: '50%', x: '35%', label: 'P' }
            ]
        },
        // --- Plus Pratiques ---
        sag_intensity: {
            title: 'Pratique: Jeux en espace restreint (Intensité)',
            players: [
                { type: 'o', y: '70%', x: '80%', label: 'O' },
                { type: 'o', y: '85%', x: '70%', label: 'O' },
                { type: 'x', y: '80%', x: '75%', label: 'X' },
                { type: 'x', y: '75%', x: '85%', label: 'X' },
                { type: 'puck', y: '90%', x: '90%', label: 'P' }
            ]
        },
        station_practice: {
            title: 'Pratique: Pratique en stations',
            players: [
                { type: 'o', y: '20%', x: '20%', label: 'S1' },
                { type: 'o', y: '80%', x: '20%', label: 'S2' },
                { type: 'o', y: '20%', x: '80%', label: 'S3' },
                { type: 'o', y: '80%', x: '80%', label: 'S4' }
            ]
        },
        game_situations: {
            title: 'Pratique: Mises en situation de match',
            players: [
                { type: 'o', y: '50%', x: '65%', label: 'O' },
                { type: 'o', y: '30%', x: '75%', label: 'O' },
                { type: 'x', y: '40%', x: '70%', label: 'X' },
                { type: 'x', y: '60%', x: '70%', label: 'X' },
                { type: 'puck', y: '50%', x: '70%', label: 'P' }
            ]
        },
        give_and_go: {
            title: 'Pratique: Le "Donne-et-va" (Give-and-Go)',
            players: [
                { type: 'o', y: '30%', x: '70%', label: 'O1' },
                { type: 'o', y: '70%', x: '70%', label: 'O2' },
                { type: 'puck', y: '35%', x: '70%', label: 'P' }
            ]
        },
        breakout_pressure: {
            title: 'Pratique: Sorties de zone (avec pression)',
            players: [
                { type: 'o', y: '80%', x: '15%', label: 'D' },
                { type: 'o', y: '50%', x: '40%', label: 'C' },
                { type: 'x', y: '70%', x: '30%', label: 'F1' },
                { type: 'puck', y: '85%', x: '15%', label: 'P' }
            ]
        },
        odd_man_rushes: {
            title: 'Pratique: Situations de surnombre (2v1)',
            players: [
                { type: 'o', y: '30%', x: '60%', label: 'A1' },
                { type: 'o', y: '70%', x: '60%', label: 'A2' },
                { type: 'x', y: '50%', x: '75%', label: 'D' },
                { type: 'puck', y: '35%', x: '60%', label: 'P' }
            ]
        },
        skating_with_pucks: {
            title: 'Pratique: Patinage de puissance avec rondelles',
            players: [
                { type: 'o', y: '20%', x: '15%', label: 'O' },
                { type: 'o', y: '40%', x: '15%', label: 'O' },
                { type: 'o', y: '60%', x: '15%', label: 'O' },
                { type: 'puck', y: '25%', x: '15%', label: 'P' },
                { type: 'puck', y: '45%', x: '15%', label: 'P' },
                { type: 'puck', y: '65%', x: '15%', label: 'P' }
            ]
        },
        corner_battles: {
            title: 'Pratique: Bataille 1v1 dans les coins',
            players: [
                { type: 'o', y: '85%', x: '85%', label: 'O' },
                { type: 'x', y: '80%', x: '80%', label: 'X' },
                { type: 'puck', y: '90%', x: '90%', label: 'P' }
            ]
        },
        goalie_drills: {
            title: 'Pratique: Exercices spécifiques aux gardiens',
            players: [
                { type: 'o', y: '50%', x: '80%', label: 'T' },
                { type: 'x', y: '50%', x: '92%', label: 'G' },
                { type: 'puck', y: '50%', x: '75%', label: 'P' }
            ]
        },
        quick_up: {
            title: 'Pratique: Relances rapides (Transition)',
            players: [
                { type: 'o', y: '50%', x: '30%', label: 'D' },
                { type: 'o', y: '30%', x: '40%', label: 'A' },
                { type: 'puck', y: '50%', x: '35%', label: 'P' }
            ]
        }
    };

    const SVG_NS = 'http://www.w3.org/2000/svg';

    const toPercentValue = (value) => {
        if (typeof value === 'number') {
            return value;
        }
        if (typeof value === 'string') {
            const numeric = parseFloat(value.replace('%', ''));
            return Number.isFinite(numeric) ? numeric : 0;
        }
        return 0;
    };

    const resolvePoint = (reference, players) => {
        if (reference == null) {
            return null;
        }

        if (typeof reference === 'number') {
            return players[reference] ?? null;
        }

        if (typeof reference === 'string') {
            return players.find((player) => player.id === reference || player.label === reference) ?? null;
        }

        if (typeof reference === 'object' && 'x' in reference && 'y' in reference) {
            return reference;
        }

        return null;
    };

    const normalizePoint = (reference, players) => {
        const rawPoint = resolvePoint(reference, players);
        if (!rawPoint) {
            return null;
        }

        return {
            x: toPercentValue(rawPoint.x),
            y: toPercentValue(rawPoint.y)
        };
    };

    const buildDefaultActions = (players = []) => {
        if (!players.length) {
            return [];
        }

        const puckPlayers = players.filter(({ type }) => type === 'puck');

        if (puckPlayers.length) {
            const primaryPuck = puckPlayers[0];
            const offensivePlayers = players.filter(({ type }) => type === 'o');

            const puckPasses = offensivePlayers.map((target) => ({
                from: primaryPuck,
                to: target,
                type: 'pass'
            }));

            const puckChain = puckPlayers.slice(1).map((target, index) => ({
                from: puckPlayers[index],
                to: target,
                type: 'support'
            }));

            return [...puckPasses, ...puckChain];
        }

        return players.slice(0, -1).map((player, index) => ({
            from: player,
            to: players[index + 1],
            type: 'support'
        }));
    };

    const createMovementPath = (action, overlay, players) => {
        const normalizedAction = Array.isArray(action)
            ? { from: action[0], to: action[1], type: action[2] }
            : action;

        if (!overlay || !normalizedAction) {
            return;
        }

        const waypoints = normalizedAction.waypoints || normalizedAction.points || [];
        const pointReferences = [normalizedAction.from ?? normalizedAction[0], ...waypoints, normalizedAction.to ?? normalizedAction[1]];

        const points = pointReferences
            .map((reference) => normalizePoint(reference, players))
            .filter(Boolean);

        if (points.length < 2) {
            return;
        }

        const polyline = document.createElementNS(SVG_NS, 'polyline');
        polyline.setAttribute('points', points.map(({ x, y }) => `${x},${y}`).join(' '));
        polyline.classList.add('movement-path');

        const type = normalizedAction.type;
        if (typeof type === 'string' && type.trim().length) {
            polyline.classList.add(`movement-path--${type.trim().toLowerCase()}`);
        }

        overlay.appendChild(polyline);
    };

    const strategyListItems = document.querySelectorAll('.strategy-list li');
    const rinkTitle = document.getElementById('rink-title');
    const rinkDisplay = document.getElementById('rink-strategy-display');

    const drawStrategy = (strategyId) => {
        if (!rinkDisplay) {
            return;
        }

        const strategy = strategyData[strategyId];
        if (!strategy) {
            console.warn(`Stratégie non trouvée: ${strategyId}`);
            return;
        }

        rinkTitle.textContent = strategy.title;
        const overlay = rinkDisplay.querySelector('.strategy-overlay');

        if (overlay) {
            while (overlay.firstChild) {
                overlay.removeChild(overlay.firstChild);
            }
        }

        rinkDisplay.querySelectorAll('.player-marker').forEach((marker) => marker.remove());

        const players = Array.isArray(strategy.players) ? strategy.players : [];

        players.forEach((player) => {
            const marker = document.createElement('div');
            marker.classList.add('player-marker');
            const top = typeof player.y === 'number' ? `${player.y}%` : player.y;
            const left = typeof player.x === 'number' ? `${player.x}%` : player.x;
            marker.style.top = top;
            marker.style.left = left;

            if (player.type === 'o') {
                marker.classList.add('player-marker-o');
            } else if (player.type === 'x') {
                marker.classList.add('player-marker-x');
            } else if (player.type === 'puck') {
                marker.classList.add('player-marker-puck');
            }

            marker.textContent = player.label || '';
            rinkDisplay.appendChild(marker);
        });

        const actions = Array.isArray(strategy.actions) && strategy.actions.length
            ? strategy.actions
            : buildDefaultActions(players);

        actions.forEach((action) => createMovementPath(action, overlay, players));
    };

    if (strategyListItems.length && rinkTitle && rinkDisplay) {
        strategyListItems.forEach((item) => {
            item.addEventListener('click', () => {
                const strategyId = item.dataset.strategyId;
                if (!strategyId) {
                    return;
                }
                drawStrategy(strategyId);
                window.scrollTo({ top: Math.max(rinkTitle.offsetTop - 80, 0), behavior: 'smooth' });
            });
        });

        drawStrategy('pp_umbrella');
    }
});

window.initializeStrategiesPage = function initializeStrategiesPage() {
    console.log('Strategies page initialized');
};
