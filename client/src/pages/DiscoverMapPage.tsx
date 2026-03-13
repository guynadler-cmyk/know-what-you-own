import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, MapPin } from "lucide-react";
import ForceGraph2D, { type ForceGraphMethods, type NodeObject } from "react-force-graph-2d";

interface MapNode {
  id: string;
  name: string;
  cluster: string;
  moatTags: string[];
  themeTags: string[];
  x?: number;
  y?: number;
}

interface MapLink {
  source: string | MapNode;
  target: string | MapNode;
  weight: number;
}

interface MapData {
  nodes: MapNode[];
  links: MapLink[];
}

type GraphNode = NodeObject<MapNode>;
type GraphLink = { source: GraphNode | string; target: GraphNode | string; weight: number };

const CLUSTER_COLORS: Record<string, string> = {
  "AI Infrastructure": "#6366f1",
  "Cloud Platforms": "#0ea5e9",
  "Cybersecurity": "#f43f5e",
  "Data Platforms": "#f59e0b",
  "Enterprise SaaS": "#10b981",
  "Semiconductors": "#8b5cf6",
};

function getClusterColor(cluster: string): string {
  return CLUSTER_COLORS[cluster] || "#6b7280";
}

export default function DiscoverMapPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const graphRef = useRef<ForceGraphMethods<NodeObject<MapNode>> | undefined>(undefined);

  const focusParam = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get("focus") || "").toUpperCase().trim();
  }, []);

  const { data: mapData, isLoading, isError, error } = useQuery<MapData>({
    queryKey: ["/api/discover/map"],
  });

  const connectedNodes = useMemo(() => {
    if (!hoveredNode || !mapData) return new Set<string>();
    const connected = new Set<string>();
    connected.add(hoveredNode);
    for (const link of mapData.links) {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      if (sourceId === hoveredNode) connected.add(targetId);
      if (targetId === hoveredNode) connected.add(sourceId);
    }
    return connected;
  }, [hoveredNode, mapData]);

  const focusOnNode = useCallback(
    (ticker: string) => {
      if (!graphRef.current || !mapData) return;
      const node = mapData.nodes.find(
        (n) => n.id.toUpperCase() === ticker.toUpperCase()
      );
      if (node && node.x !== undefined && node.y !== undefined) {
        graphRef.current.centerAt(node.x, node.y, 600);
        graphRef.current.zoom(3, 600);
        setHoveredNode(node.id);
        setTimeout(() => setHoveredNode(null), 3000);
      }
    },
    [mapData]
  );

  useEffect(() => {
    if (focusParam && mapData && graphRef.current) {
      const timer = setTimeout(() => focusOnNode(focusParam), 800);
      return () => clearTimeout(timer);
    }
  }, [focusParam, mapData, focusOnNode]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim() || !mapData) return;
      const q = searchQuery.trim().toLowerCase();
      const node = mapData.nodes.find(
        (n) =>
          n.id.toLowerCase() === q ||
          n.name.toLowerCase().includes(q)
      );
      if (node) {
        focusOnNode(node.id);
        setSearchQuery("");
      }
    },
    [searchQuery, mapData, focusOnNode]
  );

  const handleNodeClick = useCallback(
    (node: NodeObject<MapNode>) => {
      navigate(`/stocks/${node.id}`);
    },
    [navigate]
  );

  const handleNodeHover = useCallback((node: NodeObject<MapNode> | null) => {
    setHoveredNode(node ? node.id as string : null);
  }, []);

  const nodeCanvasObject = useCallback(
    (node: NodeObject<MapNode>, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as GraphNode;
      const label = n.id as string;
      const fontSize = Math.max(10 / globalScale, 2);
      const nodeR = Math.max(5, 3 + (n.moatTags?.length || 0) + (n.themeTags?.length || 0));
      const color = getClusterColor(n.cluster);
      const nodeX = n.x ?? 0;
      const nodeY = n.y ?? 0;

      const isActive = !hoveredNode || connectedNodes.has(label);
      const alpha = isActive ? 1 : 0.12;

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, nodeR, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      if (hoveredNode === label) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      if (globalScale > 1.2 || hoveredNode === label) {
        ctx.font = `${hoveredNode === label ? "bold " : ""}${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = isActive ? "hsl(0,0%,85%)" : "hsl(0,0%,40%)";
        ctx.fillText(label, nodeX, nodeY + nodeR + 2);
      }

      ctx.globalAlpha = 1;
    },
    [hoveredNode, connectedNodes]
  );

  const linkColor = useCallback(
    (link: GraphLink) => {
      if (!hoveredNode) return "rgba(255,255,255,0.06)";
      const sourceId = typeof link.source === "string" ? link.source : (link.source as GraphNode).id;
      const targetId = typeof link.target === "string" ? link.target : (link.target as GraphNode).id;
      if (sourceId === hoveredNode || targetId === hoveredNode) {
        return "rgba(255,255,255,0.35)";
      }
      return "rgba(255,255,255,0.02)";
    },
    [hoveredNode]
  );

  const clusterLegend = Object.entries(CLUSTER_COLORS);

  return (
    <SiteLayout>
      <Helmet>
        <title>Investment Discovery Map | restnvest</title>
        <meta
          name="description"
          content="Explore how companies relate to each other visually with our AI-powered investment discovery map."
        />
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/discover")}
            data-testid="button-back-discover"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Discover
          </Button>
        </div>

        <div className="mb-6">
          <h1
            className="text-2xl sm:text-3xl font-bold mb-2"
            data-testid="text-map-title"
          >
            Investment Discovery Map
          </h1>
          <p
            className="text-sm text-muted-foreground max-w-2xl"
            data-testid="text-map-subtitle"
          >
            Explore how companies relate to each other based on shared investment
            themes and competitive moats. Click any node to view its full analysis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px] max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search company or ticker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-map-search"
              />
            </div>
            <Button type="submit" size="default" data-testid="button-map-search">
              <MapPin className="h-4 w-4 mr-1" />
              Focus
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            {clusterLegend.map(([name, color]) => (
              <Badge
                key={name}
                variant="outline"
                className="no-default-hover-elevate no-default-active-elevate text-[11px] gap-1.5"
                data-testid={`badge-cluster-${name.replace(/\s+/g, "-").toLowerCase()}`}
              >
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                {name}
              </Badge>
            ))}
          </div>
        </div>

        <Card
          className="overflow-hidden"
          style={{ backgroundColor: "#0f1419", minHeight: 500 }}
          data-testid="card-graph-container"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-[500px]">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">
                  Building discovery map...
                </p>
              </div>
            </div>
          ) : mapData && mapData.nodes.length > 0 ? (
            <ForceGraph2D
              ref={graphRef as React.MutableRefObject<ForceGraphMethods<NodeObject<MapNode>> | undefined>}
              graphData={mapData}
              nodeCanvasObject={nodeCanvasObject}
              nodePointerAreaPaint={(node: NodeObject<MapNode>, color: string, ctx: CanvasRenderingContext2D) => {
                const n = node as GraphNode;
                const nodeR = Math.max(5, 3 + (n.moatTags?.length || 0) + (n.themeTags?.length || 0));
                ctx.beginPath();
                ctx.arc(n.x ?? 0, n.y ?? 0, nodeR + 2, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();
              }}
              linkColor={linkColor as (link: object) => string}
              linkWidth={0.5}
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
              backgroundColor="#0f1419"
              width={typeof window !== "undefined" ? Math.min(window.innerWidth - 64, 1200) : 900}
              height={550}
              cooldownTicks={100}
              d3AlphaDecay={0.03}
              d3VelocityDecay={0.3}
              enableZoomInteraction={true}
              enablePanInteraction={true}
            />
          ) : (
            <div className="flex items-center justify-center h-[500px]">
              <p className="text-sm text-muted-foreground">
                No companies found to display on the map.
              </p>
            </div>
          )}
        </Card>

        {hoveredNode && mapData && (
          <div className="mt-3 text-xs text-muted-foreground" data-testid="text-hovered-info">
            {(() => {
              const node = mapData.nodes.find((n) => n.id === hoveredNode);
              if (!node) return null;
              const neighborCount = connectedNodes.size - 1;
              return (
                <span>
                  <span className="font-semibold text-foreground">{node.name}</span>{" "}
                  ({node.id}) — {node.cluster} — {neighborCount} connected{" "}
                  {neighborCount === 1 ? "company" : "companies"}
                </span>
              );
            })()}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
