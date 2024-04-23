import { Role } from "./src/scheme";

export const roles: Role[] = [
    {
        org_id: "4195502c85984d27ae1aceb677d99551543808625aeb11ee88069dc8f7663e88",
        rol_id: "rol_rce_474ae9e59b3d49ce",
        name: "Bansal",
        permissions: [
            {name: "user", value: "administration"},
            {name: "viewer", value: "administration"},
            {name: "maintainer", value: "administration"}
        ],
    },
    {
        org_id: "4195502c85984d27ae1aceb677d99551543808625aeb11ee88069dc8f7663e88",
        rol_id: "rol_YHV_78ae9006bcaa4c77",
        name: "Sharma",
        permissions: [
            {name: "user", value: "administration"},
            {name: "viewer", value: "administration"},
            {name: "maintainer", value: "administration"}
        ]
    },
];

export const org_id = "4195502c85984d27ae1aceb677d99551543808625aeb11ee88069dc8f7663e88";
export const api_key = "3GkqP2s9V5N7x4Z6";
export const signed_key = "Ab12Cd34Ef";
export const secret_key = "Gh56Ij78Kl";
export const API_BASE_URL = "https://api.trustauthx.com/api/user/me/settings";