export async function GET() {
  return new Response(JSON.stringify({ message: 'API is working!' }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(req) {
  try {
    const data = await req.json();
    return new Response(JSON.stringify({ 
      message: 'POST is working!', 
      received: data 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
