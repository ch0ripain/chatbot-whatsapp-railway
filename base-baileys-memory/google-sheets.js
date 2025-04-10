// const { google } = require('googleapis');
import { google } from "googleapis";
// Initializes the Google APIs client library and sets up the authentication using service account credentials.
const auth = new google.auth.GoogleAuth({
    keyFile: './google.json',  // Path to your service account key file.
    scopes: ['https://www.googleapis.com/auth/spreadsheets']  // Scope for Google Sheets API.
});

export async function appendToSheet(values) {

    const spreadsheetId = process.env.SPREADSHEET_ID
    const sheets = google.sheets({ version: 'v4', auth }); // Create a Sheets API client instance
    const range = 'Rutatina!A1'; // The range in the sheet to start appending
    const valueInputOption = 'USER_ENTERED'; // How input data should be interpreted
    const resource = { values: [values] };

    try {
        const res = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption,
            resource,
        });
        return res; // Returns the response from the Sheets API
    } catch (error) {
        console.error('error', error); // Logs errors
    }
}

export async function readSheet(range) {
    const spreadsheetId = process.env.SPREADSHEET_ID
    const sheets = google.sheets({
        version: 'v4', auth
    });

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId, range
        });
        const rows = response.data.values; // Extracts the rows from the response.
        return rows; // Returns the rows.
    } catch (error) {
        console.error('error', error); // Logs errors.
    }
}

export async function editSheetCellsByIds(codigos = []) {
    const spreadsheetId = process.env.SPREADSHEET_ID
    const sheets = google.sheets({ version: 'v4', auth })

    try {
        // Leer todas las filas de A2:F (incluye los IDs y estados)
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Rutatina!A2:F'
        })

        const filas = res.data.values || []

        // Identificar las filas a actualizar
        const updates = []

        filas.forEach((fila, index) => {
            const idActual = fila[5] // Columna F (índice 5)
            if (codigos.includes(idActual)) {
                const filaIndex = index + 2 // +2 porque empieza en A2
                updates.push({ filaIndex })
            }
        })

        // Hacer el batch update para marcar estado 🟢
        const requests = updates.map(update => ({
            range: `Rutatina!D${update.filaIndex}`,
            values: [['🟢']]
        }))

        const batchUpdateRequest = {
            data: requests,
            valueInputOption: 'USER_ENTERED'
        }

        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            resource: batchUpdateRequest
        })

        return { ok: true, cantidad: updates.length }
    } catch (error) {
        console.error('Error al actualizar estados:', error)
        return { ok: false, error }
    }
}

export async function deleteSheetRowById(codigo, nombre) {
    const spreadsheetId = process.env.SPREADSHEET_ID
    const sheets = google.sheets({ version: 'v4', auth })

    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Rutatina!A2:F'
        })

        const filas = res.data.values || []
        let filaAEliminar = null
        let codigoExiste = false

        filas.forEach((fila, index) => {
            const nombreFila = (fila[0] || '').trim().toLowerCase() // Columna A
            const id = (fila[5] || '').trim().toUpperCase()         // Columna F

            if (id === codigo.toUpperCase()) {
                codigoExiste = true
                if (nombreFila === nombre.trim().toLowerCase()) {
                    filaAEliminar = index + 1 // A2 es la fila 2
                }
            }
        })

        if (filaAEliminar === null) {
            if (codigoExiste) {
                return { ok: false, error: 'No puedes borrar actividades de otros usuarios 🥸' }
            } else {
                return { ok: false, error: 'No se encontró una fila con ese código.' }
            }
        }

        const deleteRequest = {
            requests: [
                {
                    deleteDimension: {
                        range: {
                            sheetId: 0,
                            dimension: 'ROWS',
                            startIndex: filaAEliminar, // +1 por encabezado
                            endIndex: filaAEliminar + 1
                        }
                    }
                }
            ]
        }

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: deleteRequest
        })

        return { ok: true, cantidad: 1 }
    } catch (error) {
        console.error('Error al eliminar fila:', error)
        return { ok: false, error }
    }
}




