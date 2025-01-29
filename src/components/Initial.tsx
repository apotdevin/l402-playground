"use client";

import { useQuery } from "@tanstack/react-query";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { FC, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { getStatusDescription } from "@/lib/status";
import QRCode from "react-qr-code";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

function extractInvoice(input: string): string {
  const regex = /invoice="([^ ]+)"/;
  const match = input.match(regex);

  return match ? match[1] : ""; // Return the captured group or null if no match
}

function extractMacaroon(input: string): string {
  const regex = /macaroon="([^ ]+)"/;
  const match = input.match(regex);

  return match ? match[1] : ""; // Return the captured group or null if no match
}

const fetchData = async (
  url: string,
  auth: { macaroon: string; preimage: string } | undefined,
  body: string | undefined
) => {
  const method = !!body ? "POST" : "GET";

  const res = await fetch(url, {
    method,
    headers: {
      ...(auth
        ? { Authorization: `L402 ${auth?.macaroon}:${auth?.preimage}` }
        : undefined),
      ...(!!body ? { "Content-Type": "application/json" } : undefined),
    },
    body,
  });

  console.log(res);

  if (!res.ok) {
    return {
      statusCode: res.status,
      authHeader: res.headers.get("www-authenticate"),
    };
  }

  const result = await res.text();

  let json = undefined;
  try {
    json = JSON.parse(result);
  } catch (error) {
    console.error("Failed to json parse: ", { error, result });
  }

  return { statusCode: res.status, result: json || result };
};

const urls = [
  {
    name: "Coin Prices",
    url: "/l402/v1/protected/coins/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur,cop",
  },
  {
    name: "IP Info",
    url: "/l402/v1/protected/ip/json/24.48.0.1",
  },
  {
    name: "IP Info 2",
    url: "/l402/v1/protected/ip/json/102.217.238.0",
  },
  {
    name: "Recommended Channels",
    url: "/l402/v1/protected/channel/recommend",
    body: JSON.stringify(
      {
        pubkey:
          "038a9e56512ec98da2b5789761f7af8f280baf98a09282360cd6ff1381b5e889bf",
        capacity: 10000000,
        mode: "sender",
      },
      null,
      2
    ),
  },
  {
    name: "Website Scraper",
    url: "/l402/v1/protected/scrape?url=https://bitcoinerjobs.com",
  },
  {
    name: "LLM",
    url: "/l402/v1/protected/llm/chat/completion",
    body: JSON.stringify(
      {
        model: "gpt-4o-2024-08-06",
        messages: [{ role: "user", content: "Hello, how are you?" }],
      },
      null,
      2
    ),
  },
  {
    name: "LLM Response",
    url: "/l402/v1/protected/llm/chat/completion/ID_FROM_PREVIOUS_STEP",
  },
  {
    name: "RAG",
    url: "/l402/v1/protected/rag/chat/completion",
    body: JSON.stringify(
      {
        rag: "COLOMBIAN_REAL_ESTATE",
        prompt: "Find three apartments in Bogotá Colombia",
      },
      null,
      2
    ),
  },
  {
    name: "RAG Response",
    url: "/l402/v1/protected/rag/chat/completion/ID_FROM_PREVIOUS_STEP",
  },
];

const DefaultButtons: FC<{
  setButton: (url: string, body: string | undefined) => void;
}> = ({ setButton }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((u) => (
        <Button
          key={u.url}
          variant={"secondary"}
          onClick={() => setButton(u.url, u.body)}
        >
          {u.name}
        </Button>
      ))}
    </div>
  );
};

export const Initial = () => {
  const [url, setUrl] = useState(urls[0].url);

  const [body, setBody] = useState("");
  const [macaroon, setMacaroon] = useState("");
  const [preimage, setPreimage] = useState("");

  const [bodyOpen, setBodyOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["fetchData", url],
    queryFn: () =>
      fetchData(
        url,
        macaroon && preimage ? { macaroon, preimage } : undefined,
        body || undefined
      ),
    enabled: false,
    retry: false,
  });

  const handleFetch = () => {
    if (isLoading || isFetching) return;
    if (!url) return;
    refetch();
  };

  const setButton = (url: string, body: string | undefined) => {
    setUrl(url);
    if (body) {
      setBody(body);
      setBodyOpen(true);
    } else {
      setBody("");
      setBodyOpen(false);
    }
  };

  const authInfo = useMemo(() => {
    if (!data?.authHeader) return { macaroon: "", invoice: "" };

    return {
      macaroon: extractMacaroon(data?.authHeader || ""),
      invoice: extractInvoice(data?.authHeader || ""),
    };
  }, [data]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-black text-2xl">L402 Playground</h1>
      <DefaultButtons setButton={(u, b) => setButton(u, b)} />
      <div className="grid w-full items-center gap-1.5">
        <Label className="font-bold" htmlFor="url">
          URL
        </Label>
        <div className="flex gap-2 w-full">
          <Input
            id="url"
            placeholder="URL"
            value={url}
            onChange={(v) => setUrl(v.target.value)}
            className="font-mono"
          />
          <Button onClick={handleFetch}>
            {isLoading || isFetching ? "Loading" : "Fetch"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="w-full flex justify-between items-center">
            <CardTitle>Body</CardTitle>
            <Button
              variant={"secondary"}
              onClick={() => setBodyOpen((p) => !p)}
            >
              {bodyOpen ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </CardHeader>
        {bodyOpen ? (
          <CardContent>
            <textarea
              value={body}
              onChange={(v) => setBody(v.target.value)}
              style={{
                width: "100%",
                height: "160px",
                fontFamily: "monospace",
                fontSize: "14px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "10px",
                backgroundColor: "#f9f9f9",
              }}
            />
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <div className="w-full flex justify-between items-center">
            <CardTitle>Authentication</CardTitle>
            <Button
              variant={"secondary"}
              onClick={() => setAuthOpen((p) => !p)}
            >
              {authOpen ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </CardHeader>
        {authOpen ? (
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="grid w-full items-center gap-1.5">
                <Label className="font-bold" htmlFor="macaroon">
                  Macaroon
                </Label>

                <Input
                  id="macaroon"
                  value={macaroon}
                  onChange={(v) => setMacaroon(v.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label className="font-bold" htmlFor="preimage">
                  Preimage
                </Label>

                <Input
                  id="preimage"
                  value={preimage}
                  onChange={(v) => setPreimage(v.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid w-full items-center gap-1.5">
              {data ? (
                <div>
                  <Badge>{`${data.statusCode} - ${getStatusDescription(
                    data.statusCode
                  )}`}</Badge>
                </div>
              ) : null}

              <textarea
                id="resultcode"
                value={JSON.stringify(data, null, 2)}
                readOnly
                style={{
                  width: "100%",
                  height: "300px",
                  fontFamily: "monospace",
                  fontSize: "14px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  padding: "10px",
                  backgroundColor: "#f9f9f9",
                }}
              />
            </div>

            {authInfo.invoice ? (
              <div className="grid w-full items-center gap-1.5">
                <Label className="font-bold" htmlFor="resultinvoice">
                  Invoice
                </Label>

                <div className="flex gap-2 sm:flex-row flex-col">
                  <textarea
                    id="resultinvoice"
                    value={authInfo.invoice}
                    readOnly
                    style={{
                      width: "100%",
                      height: "286px",
                      fontFamily: "monospace",
                      fontSize: "14px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      padding: "10px",
                      backgroundColor: "#f9f9f9",
                    }}
                  />

                  <div className="h-auto w-full bg-white p-4 border rounded-md">
                    <QRCode
                      size={256}
                      style={{
                        height: "auto",
                        maxWidth: "100%",
                        width: "100%",
                      }}
                      value={authInfo.invoice}
                      viewBox={`0 0 256 256`}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {authInfo.invoice ? (
              <div className="grid w-full items-center gap-1.5">
                <Label className="font-bold" htmlFor="resultmacaroon">
                  Macaroon
                </Label>

                <textarea
                  id="resultmacaroon"
                  value={authInfo.macaroon}
                  readOnly
                  style={{
                    width: "100%",
                    height: "160px",
                    fontFamily: "monospace",
                    fontSize: "14px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    padding: "10px",
                    backgroundColor: "#f9f9f9",
                  }}
                />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
