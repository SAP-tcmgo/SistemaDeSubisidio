"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var app_1 = require("firebase/app");
var firestore_1 = require("firebase/firestore");
// Configuração do Firebase
var firebaseConfig = {
    apiKey: "AIzaSyCsFTpa3BjOUl7l3pBmmpnT7-q1w8OS4xY",
    authDomain: "siaap-subsidios.firebaseapp.com",
    projectId: "siaap-subsidios",
    storageBucket: "siaap-subsidios.firebasestorage.app",
    messagingSenderId: "567063169065",
    appId: "1:567063169065:web:b80c4285e34d527c1cb438",
    measurementId: "G-randomstring"
};
// Inicializa o Firebase
var app = (0, app_1.initializeApp)(firebaseConfig);
var db = (0, firestore_1.getFirestore)(app);
function setupFirestore() {
    return __awaiter(this, void 0, void 0, function () {
        var usuariosCollection, cargosCollection, usuarioCargoCollection, tokensCollection;
        return __generator(this, function (_a) {
            try {
                usuariosCollection = (0, firestore_1.collection)(db, "usuarios");
                cargosCollection = (0, firestore_1.collection)(db, "cargos");
                usuarioCargoCollection = (0, firestore_1.collection)(db, "usuario_cargo");
                tokensCollection = (0, firestore_1.collection)(db, "tokens");
                console.log("Collections created successfully.");
                // Você pode adicionar documentos às coleções aqui, se necessário
                // Exemplo:
                // const newUsuarioRef = doc(usuariosCollection); // Gera automaticamente um ID único
                // await setDoc(newUsuarioRef, {
                //   nome_completo: "Nome do Usuario",
                //   email: "email@example.com",
                //   senha_hash: "hashed_password",
                //   data_criacao: new Date()
                // });
                // console.log("Added a new user to usuarios collection");
            }
            catch (e) {
                console.error("Error setting up Firestore: ", e);
            }
            return [2 /*return*/];
        });
    });
}
setupFirestore();
