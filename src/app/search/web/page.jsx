"use client"
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from "react";
import { MemoizedReactMarkdown } from '../../../components/MemoizedReactMarkdown'
import { CodeBlock } from '../../../components/CodeBlock';
import WebSearchResults from '../../../components/WebSearchResults';

export default function WebSearchPage() {
  const searchParams = useSearchParams()

  const [aiResponse, setAiResponse] = useState("");
  const [searchTerm, setSearchTerm] = useState()
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    try {
      const streamArray = JSON.parse(aiResponse);
      setSearchResults(streamArray);
    } catch (err) {
      return;
    }
  }, [aiResponse])

  useEffect(() => {
    setSearchTerm(searchParams.get('searchTerm'))
  }, [searchParams])

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    if (!searchTerm) {
      return;
    }
  
    async function fetchData() {
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: searchTerm }),
        signal,
      });
      const data = response.body;
      if (!data) {
        return;
      }

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        if (chunkValue) {
          setAiResponse(chunkValue);
        }
      }
    };
  
    fetchData();
  
    return () => controller.abort();
  }, [searchParams, searchTerm]);

  return (
    <>
      {!searchResults.length ? <div style={{ padding: "20px" }} className="flex flex-row">
        <MemoizedReactMarkdown
          className="prose dark:prose-invert flex-1"
          components={{
            code({ node, inline, className, children, ...props }) {
              if (children.length) {
                if (children[0] == '▍') {
                  return <span className="animate-pulse cursor-default mt-1">▍</span>
                }
                children[0] = (children[0]).replace("`▍`", "▍")
              }
              const match = /language-(\w+)/.exec(className || '');
              return !inline ? (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ''}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            table({ children }) {
              return (
                <table className="border-collapse border border-black px-3 py-1 dark:border-white">
                  {children}
                </table>
              );
            },
            th({ children }) {
              return (
                <th className="break-words border border-black bg-gray-500 px-3 py-1 text-white dark:border-white">
                  {children}
                </th>
              );
            },
            td({ children }) {
              return (
                <td className="break-words border border-black px-3 py-1 dark:border-white">
                  {children}
                </td>
              );
            },
          }}
        >
          {aiResponse}         
        </MemoizedReactMarkdown> 
      </div> : <WebSearchResults results={searchResults} />}
      </>
    );
}