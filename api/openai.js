export async function requestOpenAI(prompt, apiKey) {
  if (!apiKey) {
    return {
      text: "Fonctionnalité OpenAI non configurée. Configure la clé API pour activer le moteur IA.",
    };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
    }),
  });

  const data = await response.json();
  return { text: data?.choices?.[0]?.message?.content || "Aucune réponse reçue." };
}
