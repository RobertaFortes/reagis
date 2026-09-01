import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks"; 
import { wsSubmitVote, } from "@/store/socketMiddleware";
import { CenteredCard } from "@/components/CenteredCard";
import { BarReactionCount } from '@/components/BarReactionCount';

interface VoteOption { id: string; label: string; } 
interface VotePageProps { stepLabel: string; progress: number; questionIndex: number; questionTotal: number; questionText: string; options: VoteOption[]; reactionEmoji: string; reactionCount: number; onSubmit: (optionId: string) => void; submitting: boolean; }

const VotePage = () => { 
  const { code } = useParams<{ code: string }>(); 
  const dispatch = useAppDispatch(); 
  // La question arrive dans Redux via socketMiddleware 
  const question = useAppSelector((state) => state.question); 
  const [selectedOption, setSelectedOption] = useState<string | null>(null); 
  const [submitting, setSubmitting] = useState(false); 
  
  if (!question.id) { 
    return ( <>
              <CenteredCard> 
                <p>En attente de la prochaine question…</p> 
              </CenteredCard> 
              <div className="React-session">
                <BarReactionCount />
              </div>  
             </>
    );
  }  
  const handleSubmit = () => { 
    if (!selectedOption || submitting) { 
      return; 
    } 
    
    setSubmitting(true); 
    dispatch( 
      wsSubmitVote( 
        question.id, 
        Number(selectedOption) 
      ) 
    );
    // Le middleware s'occupe de l'envoi Socket.IO. 
    // On peut réactiver le bouton après l'envoi. 
    setTimeout(() => { setSubmitting(false); }, 300); 
  };
  
  return ( <>
            <CenteredCard>
             <div className="vote-page"> 
                <div className="vote-session"> 
                  Session {code ?? ""} 
                </div>
                <h1>{question.text}</h1>
                <div className="vote-options"> 
                  {question.options.map((option, index) => {
                    const optionId = String(index);
                    const selected = selectedOption === optionId; 
                    return ( 
                      <button 
                        key={optionId} 
                        type="button" 
                        className={`opt-card-kit${selected ? " sel" : ""}`} 
                        onClick={() => setSelectedOption(optionId)}
                      > 
                        <span className="radio-kit" /> 
                        <span>{option.label}</span> 
                      </button> 
                    );
                  })} 
                </div>
                <button 
                  type="button" 
                  className="btn-primary" 
                  disabled={!selectedOption || submitting} 
                  onClick={handleSubmit}
                > 
                  {submitting ? "Vote en cours…" : "Voter"}
                </button>  
                 
              </div> 
             </CenteredCard> 
             <div className="React-session">
                <BarReactionCount />
             </div> 
            </>
          ); 
        };

export default VotePage;