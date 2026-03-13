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
  group: number;
  moatTags: string[];
  themeTags: string[];
  linkCount: number;
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
  "AI Infrastructure": "#8b5cf6",
  "Cloud Platforms": "#3b82f6",
  "Cybersecurity": "#f97316",
  "Data Platforms": "#14b8a6",
  "Enterprise SaaS": "#22c55e",
  "Semiconductors": "#eab308",
};

const FALLBACK_COLOR = "#94A3B8";

function getClusterColor(cluster: string): string {
  return CLUSTER_COLORS[cluster] || FALLBACK_COLOR;
}

const GRAPH_HEIGHT = 700;

export default function DiscoverMapPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const graphRef = useRef<ForceGraphMethods<NodeObject<MapNode>> | undefined>(undefined);
  const graphContainerRef = useRef<HTMLDivElement>(null);

  const focusParam = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get("focus") || "").toUpperCase().trim();
  }, []);

  const { data: mapData, isLoading } = useQuery<MapData>({
    queryKey: ["/api/discover/map"],
  });

  const processedData = useMemo(() => {
    if (!mapData) return null;

    const safeLinks = mapData.links ?? [];
    const degreeMap = new Map<string, number>();
    for (const link of safeLinks) {
      const src = typeof link.source === "string" ? link.source : link.source.id;
      const tgt = typeof link.target === "string" ? link.target : link.target.id;
      degreeMap.set(src, (degreeMap.get(src) || 0) + 1);
      degreeMap.set(tgt, (degreeMap.get(tgt) || 0) + 1);
    }

    const nodes = (mapData.nodes ?? []).map((n) => ({
      ...n,
      degree: degreeMap.get(n.id) || 0,
      linkCount: n.linkCount || degreeMap.get(n.id) || 0,
    }));

    return { nodes, links: safeLinks };
  }, [mapData]);

  const dataClusters = useMemo(() => {
    if (!mapData) return Object.keys(CLUSTER_COLORS);
    const clusters = new Set<string>();
    for (const node of (mapData.nodes ?? [])) {
      if (node.cluster) clusters.add(node.cluster);
    }
    return Array.from(clusters).sort();
  }, [mapData]);

  const connectedNodes = useMemo(() => {
    if (!hoveredNode || !mapData) return new Set<string>();
    const connected = new Set<string>();
    connected.add(hoveredNode);
    for (const link of (mapData.links ?? [])) {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      if (sourceId === hoveredNode) connected.add(targetId);
      if (targetId === hoveredNode) connected.add(sourceId);
    }
    return connected;
  }, [hoveredNode, mapData]);

  const neighborNames = useMemo(() => {
    if (!hoveredNode || !mapData) return [];
    const seen = new Set<string>();
    const neighbors: { id: string; name: string }[] = [];
    for (const link of (mapData.links ?? [])) {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      let neighborId: string | null = null;
      if (sourceId === hoveredNode) neighborId = targetId;
      if (targetId === hoveredNode) neighborId = sourceId;
      if (neighborId && !seen.has(neighborId)) {
        seen.add(neighborId);
        const node = mapData.nodes.find((n) => n.id === neighborId);
        if (node) neighbors.push({ id: node.id, name: node.name });
      }
    }
    return neighbors.slice(0, 5);
  }, [hoveredNode, mapData]);

  const focusOnNode = useCallback(
    (ticker: string) => {
      if (!graphRef.current || !mapData) return;
      const node = mapData.nodes.find(
        (n) => n.id.toUpperCase() === ticker.toUpperCase()
      );
      if (node && node.x !== undefined && node.y !== undefined) {
        graphRef.current.centerAt(node.x, node.y, 600);
        graphRef.current.zoom(2.5, 600);
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

  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;

    type D3ForceWithStrength = { strength: (val: number) => void };
    type D3ForceWithDistance = { distance: (val: number) => void };

    const charge = fg.d3Force("charge") as D3ForceWithStrength | null;
    if (charge && typeof charge.strength === "function") {
      charge.strength(-120);
    }

    const link = fg.d3Force("link") as D3ForceWithDistance | null;
    if (link && typeof link.distance === "function") {
      link.distance(90);
    }

    const center = fg.d3Force("center") as D3ForceWithStrength | null;
    if (center && typeof center.strength === "function") {
      center.strength(0.05);
    }
  }, [mapData]);

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
    if (!node) {
      setTooltipPos(null);
    }
  }, []);

  const handleContainerMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!graphContainerRef.current) return;
    const rect = graphContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTooltipPos({ x, y });
  }, []);

  const nodeCanvasObject = useCallback(
    (node: NodeObject<MapNode>, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as GraphNode;
      const label = n.id as string;
      const lc = n.linkCount || 0;
      const nodeR = Math.max(3, Math.min(16, 3 + lc * 1.5));
      const color = getClusterColor(n.cluster);
      const nodeX = n.x ?? 0;
      const nodeY = n.y ?? 0;

      const isHoverActive = !hoveredNode || connectedNodes.has(label);
      const isClusterActive = !activeCluster || n.cluster === activeCluster;
      const isActive = isHoverActive && isClusterActive;
      const alpha = isActive ? 1 : 0.06;

      ctx.globalAlpha = alpha;

      ctx.beginPath();
      ctx.arc(nodeX, nodeY, nodeR + 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = `${color}22`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(nodeX, nodeY, nodeR, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      if (hoveredNode === label) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5 / globalScale;
        ctx.stroke();

        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, nodeR, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      const fontSize = Math.max(10 / globalScale, 2);
      const showLabel = globalScale > 1.0 || hoveredNode === label || lc >= 5;
      if (showLabel) {
        ctx.font = `${hoveredNode === label ? "bold " : ""}${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = isActive ? "rgba(220,225,230,0.9)" : "rgba(120,125,130,0.3)";
        ctx.fillText(label, nodeX, nodeY + nodeR + 2);
      }

      ctx.globalAlpha = 1;
    },
    [hoveredNode, connectedNodes, activeCluster]
  );

  const linkColor = useCallback(
    (link: GraphLink) => {
      if (!hoveredNode) return "rgba(120,120,120,0.12)";
      const sourceId = typeof link.source === "string" ? link.source : (link.source as GraphNode).id;
      const targetId = typeof link.target === "string" ? link.target : (link.target as GraphNode).id;
      if (sourceId === hoveredNode || targetId === hoveredNode) {
        return "rgba(255,255,255,0.45)";
      }
      return "rgba(120,120,120,0.03)";
    },
    [hoveredNode]
  );

  const linkWidth = useCallback(
    (link: GraphLink) => {
      return 0.5 + (link.weight || 0) * 2;
    },
    []
  );

  const tooltipNode = hoveredNode && mapData ? mapData.nodes.find((n) => n.id === hoveredNode) : null;

  const clampedTooltipPos = useMemo(() => {
    if (!tooltipPos || !graphContainerRef.current) return null;
    const containerWidth = graphContainerRef.current.offsetWidth;
    const tooltipW = 240;
    const tooltipH = 180;
    const offset = 16;
    let x = tooltipPos.x + offset;
    let y = tooltipPos.y + offset;
    if (x + tooltipW > containerWidth - 8) x = tooltipPos.x - tooltipW - offset;
    if (y + tooltipH > GRAPH_HEIGHT - 8) y = GRAPH_HEIGHT - tooltipH - 8;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    return { x, y };
  }, [tooltipPos]);

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

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
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
              Explore clusters of companies with similar business models, technologies, and strategic advantages.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto sm:min-w-[280px] sm:max-w-sm flex-shrink-0">
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
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4" data-testid="cluster-filter-pills">
          <Badge
            variant={activeCluster === null ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() => setActiveCluster(null)}
            data-testid="pill-cluster-all"
          >
            All
          </Badge>
          {dataClusters.map((label) => (
            <Badge
              key={label}
              variant={activeCluster === label ? "default" : "outline"}
              className="cursor-pointer select-none gap-1.5"
              onClick={() => setActiveCluster(activeCluster === label ? null : label)}
              data-testid={`pill-cluster-${label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: getClusterColor(label) }}
              />
              {label}
            </Badge>
          ))}
        </div>

        <div className="relative" ref={graphContainerRef} onMouseMove={handleContainerMouseMove}>
          <Card
            className="overflow-hidden"
            style={{ backgroundColor: "#0a0e13", minHeight: GRAPH_HEIGHT }}
            data-testid="card-graph-container"
          >
            {isLoading ? (
              <div className="flex items-center justify-center" style={{ height: GRAPH_HEIGHT }}>
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">
                    Building discovery map...
                  </p>
                </div>
              </div>
            ) : mapData && (mapData.nodes ?? []).length > 0 ? (
              <ForceGraph2D
                ref={graphRef as React.MutableRefObject<ForceGraphMethods<NodeObject<MapNode>> | undefined>}
                graphData={{ nodes: processedData?.nodes ?? mapData?.nodes ?? [], links: processedData?.links ?? mapData?.links ?? [] }}
                nodeCanvasObject={nodeCanvasObject}
                nodePointerAreaPaint={(node: NodeObject<MapNode>, color: string, ctx: CanvasRenderingContext2D) => {
                  const n = node as GraphNode;
                  const lc = n.linkCount || 0;
                  const nodeR = Math.max(3, Math.min(16, 3 + lc * 1.5));
                  ctx.beginPath();
                  ctx.arc(n.x ?? 0, n.y ?? 0, nodeR + 3, 0, 2 * Math.PI);
                  ctx.fillStyle = color;
                  ctx.fill();
                }}
                linkColor={linkColor as (link: object) => string}
                linkWidth={linkWidth as (link: object) => number}
                onNodeClick={handleNodeClick}
                onNodeHover={handleNodeHover}
                backgroundColor="#0a0e13"
                width={typeof window !== "undefined" ? Math.min(window.innerWidth - 64, 1200) : 900}
                height={GRAPH_HEIGHT}
                cooldownTicks={200}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
                enableZoomInteraction={true}
                enablePanInteraction={true}
              />
            ) : (
              <div className="flex items-center justify-center" style={{ height: GRAPH_HEIGHT }}>
                <p className="text-sm text-muted-foreground">
                  No companies found to display on the map.
                </p>
              </div>
            )}
          </Card>

          <div
            className="absolute bottom-4 left-4 rounded-lg p-3 text-xs shadow-md z-10"
            style={{ background: "rgba(10,14,19,0.92)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.06)" }}
            data-testid="map-legend"
          >
            <p className="font-semibold text-[11px] mb-2 text-gray-400 uppercase tracking-wider">Clusters</p>
            <div className="flex flex-col gap-1.5">
              {Object.entries(CLUSTER_COLORS).map(([label, color]) => (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: color, boxShadow: `0 0 6px ${color}44` }}
                  />
                  <span className="text-gray-400 text-[11px]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="absolute top-4 right-4 rounded-lg px-3 py-2 text-[10px] z-10"
            style={{ background: "rgba(10,14,19,0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.06)" }}
            data-testid="map-stats"
          >
            {mapData && (
              <span className="text-gray-500">
                {(mapData.nodes ?? []).length} companies &middot; {(mapData.links ?? []).length} connections
              </span>
            )}
          </div>

          {tooltipNode && clampedTooltipPos && (
            <div
              className="absolute z-20 rounded-lg p-3 text-xs shadow-lg pointer-events-none"
              style={{
                left: clampedTooltipPos.x,
                top: clampedTooltipPos.y,
                width: 240,
                background: "rgba(10,14,19,0.95)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              data-testid="tooltip-node-info"
            >
              <p className="font-bold text-sm text-gray-100 mb-0.5">{tooltipNode.name}</p>
              <p className="text-[11px] mb-2" style={{ color: getClusterColor(tooltipNode.cluster) }}>
                {tooltipNode.cluster}
              </p>
              {neighborNames.length > 0 && (
                <>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Similar Companies</p>
                  <ul className="flex flex-col gap-0.5">
                    {neighborNames.map((nb) => (
                      <li key={nb.id} className="text-gray-400 text-[11px] flex items-center gap-1.5">
                        <span className="inline-block w-1 h-1 rounded-full bg-gray-500 flex-shrink-0" />
                        {nb.name} <span className="text-gray-600">({nb.id})</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
