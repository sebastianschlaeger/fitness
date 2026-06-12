import { type Env, jsonResponse } from '../../_db'

/**
 * Verlauf des maximalen Gewichts (= schwerster Satz) je Trainingstag für eine
 * Übung — aufsteigend nach Datum, damit der Chart links→rechts älter→neuer läuft.
 * Sätze ohne Gewicht (Aufwärmen/leer) werden ignoriert.
 */
export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const exerciseId = params.exerciseId

  const result = await env.DB.prepare(
    `SELECT wl.date AS date, MAX(el.weight_kg) AS max_weight
     FROM exercise_logs el
     JOIN workout_logs wl ON el.workout_id = wl.id
     WHERE el.exercise_id = ? AND el.weight_kg > 0
     GROUP BY wl.date
     ORDER BY wl.date ASC`
  ).bind(exerciseId).all()

  return jsonResponse(result.results)
}
